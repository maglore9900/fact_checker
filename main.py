from modules.factcheckexplorer import FactCheckLib
from modules import adapter
import environ

env = environ.Env()
environ.Env.read_env()
ad = adapter.Adapter(env)

fact_check = FactCheckLib(language="en", num_results=50)

# claim = "microsoft owns openai"
# claim = "climate change is false"
claim = input("Enter a claim to validate: ")

extract_prompt = "Extract the keywords from the following text: {claim}. These keywords will be used to search for information in a database. Only return the key words. Do not include any other text."
validate_prompt = """Validate the following claim: {claim} based on the following information: {report}. 
Answer the claim, if the claim is not a question, but keywords, then review the data and determine if the claim subject is true or false.
When responding provide sources where possible so that the user can verify the information."""
reduce_prompt = "The following keywords: '{key_words}' are too broad. The most important keywords are typically nouns. Remove the least relevant keyword. Return the reduced keywords only."

def clean_keywords(key_words):
    if ":" in key_words:
        key_words = key_words.split(":")[1].strip()
    key_words = key_words.replace(",", "").replace("and", "").replace("or", "").replace('*', "")
    return key_words

key_words = clean_keywords(ad.llm_chat.invoke(extract_prompt.format(claim=claim)).content)
print(f"Extracted key words: {key_words}")

while True:
    report = fact_check.process(key_words)
    if len( report ) == 0:
        if len(key_words) == 0:
            print("No keywords extracted. Exiting.")
            break
        else:
            key_words =  clean_keywords(ad.llm_chat.invoke(reduce_prompt.format(key_words=key_words)).content)
            print( f"Reduced key words: {key_words}")
    else:    
        check = ad.llm_chat.invoke(validate_prompt.format(claim=claim, report=report)).content
        print(f"Validation result: {check}")
        break


# print(ad.llm_chat.invoke(reduce_prompt.format(key_words=key_words)).content)