// FactCheckExplorer.js: Converted from Python to JavaScript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FactCheckExplorer {
  constructor(language = null, num_results = 100) {
    this.language = language;
    this.num_results = num_results;
    this.filepath = "results/";
    this.url = 'https://toolbox.google.com/factcheck/api/search';
    this.params = {
      num_results: String(this.num_results),
      force: 'false',
      offset: '0',
    };

    if (language && language.toLowerCase() !== 'all') {
      this.params.hl = language;
    }

    this.headers = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json, text/plain, */*',
    };
  }

  _sanitizeQueryForFilename(query) {
    return query.replace(/\W+/g, '_');
  }

  async fetchData(query) {
    try {
      const params = { ...this.params, query };
      const response = await axios.get(this.url, { params, headers: this.headers });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data: ${error}`);
      return null;
    }
  }

  static cleanJson(rawJson) {
    try {
      return JSON.parse(rawJson.replace(/^\)\]\}\'\n/, ''));
    } catch (error) {
      console.error(`JSON decoding failed: ${error}`);
      return [];
    }
  }

  extractInfo(data) {
    if (!data || !Array.isArray(data) || !data[0]) {
      return [];
    }

    const parsedClaims = [];
    try {
      const tagMapping = Object.fromEntries(data[0][2]);

      for (const claim of data[0][1]) {
        const claimDetails = FactCheckExplorer._parseClaim(claim, tagMapping);
        if (claimDetails) {
          parsedClaims.push(claimDetails);
        }
      }
      return parsedClaims;
    } catch (error) {
      return [];
    }
  }

  static _parseClaim(claim, tagMapping) {
    try {
      const claimText = claim[0] ? claim[0][0] : null;
      const sourceDetails = claim[0] && claim[0][3] ? claim[0][3][0] : null;
      const sourceName = sourceDetails && sourceDetails[0] ? sourceDetails[0][0] : null;
      const sourceUrl = sourceDetails ? sourceDetails[1] : null;
      const verdict = sourceDetails ? sourceDetails[3] : null;
      let reviewPublicationDate = (sourceDetails && sourceDetails.length > 11) ? sourceDetails[11] : null;
      const imageUrl = (claim.length > 1) ? claim[1] : null;
      const claimTags = (claim[0] && claim[0].length > 8 && claim[0][8]) ? claim[0][8] : [];
      const tags = claimTags.map(tag => tagMapping[tag[0]]).filter(tag => tag !== undefined);

      if (reviewPublicationDate) {
        reviewPublicationDate = new Date(reviewPublicationDate * 1000).toISOString().replace('T', ' ').slice(0, 19);
      }

      return {
        "Claim": claimText,
        "Source Name": sourceName,
        "Source URL": sourceUrl,
        "Verdict": verdict,
        "Review Publication Date": reviewPublicationDate,
        "Image URL": imageUrl,
        "Tags": tags
      };
    } catch (error) {
      console.error(`Error parsing claim: ${error}`);
      return null;
    }
  }

  convertToCSV(data, query) {
    if (!data || data.length === 0) {
      console.log("No data to save.");
      return;
    }

    const sanitizedQuery = this._sanitizeQueryForFilename(query);
    const csvFilename = path.join(this.filepath, `${sanitizedQuery}.csv`);
    const fieldNames = Object.keys(data[0]);

    const csvRows = [
      fieldNames.join(','),
      ...data.map(row => fieldNames.map(field => JSON.stringify(row[field] || '')).join(','))
    ];

    fs.writeFileSync(csvFilename, csvRows.join('\n'), 'utf8');
  }

  async process(query) {
    const rawJson = await this.fetchData(query);
    if (rawJson) {
      const cleanedJson = FactCheckExplorer.cleanJson(rawJson);
      const extractedInfo = this.extractInfo(cleanedJson);
      // if (extractedInfo) {
      //   this.convertToCSV(extractedInfo, query);
      // }
      return extractedInfo;
    }
    return [];
  }
}

module.exports = FactCheckExplorer;
// Example usage:
// const factCheckExplorer = new FactCheckExplorer('en');
// factCheckExplorer.process('climate change is false').then(console.log);
