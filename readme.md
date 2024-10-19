# Fact Checker

This code base relies HEAVILY on the work of [GONZOsint](https://github.com/GONZOsint/factcheckexplorer)

The fact claim checking is done through Google Fact Check and the google documentation for their tool is awful. Gonzo did all the heavy lifting in developing code that can effectively communicate with the Google service.

I modified their work for my use case, as well as added new functionality. Specifically I created a function that will modify the search criteria if nothing is returned by Google, and then rather than simply save the response as a report it now passes it to an AI/LLM that reviews the original claim and the returned data. The validation response from the LLM is instructed to pass sources for each fact check, so that you can follow up if you desire.

This tool can be used with OpenAI or leveraging [Ollama](https://github.com/ollama/ollama), any local LLM. In regard to Local LLMs Llama3.2:3b has been tested and performs well.


The ultimate goal of this project is to integrate with a browser, allowing anyone to highlight some text and perform a fact check.
