import requests
import json

def get_vector_ids():
    """Fetch vector IDs from the Cloudflare Vectorize API."""
    url = "https://api.cloudflare.com/client/v4/accounts/account-id/vectorize/v2/indexes/index-name/query"
    headers = {
        "Authorization": "Bearer TOKEN",
        "Content-Type": "application/json"
    }
    payload = {
        "vector": [0] * 768,  # 768-dimensional zero vector
        "topK": 100,
        "filter": {}
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        try:
            response_data = response.json()
            vector_ids = [match["id"] for match in response_data.get("result", {}).get("matches", [])]
            return vector_ids
        except json.JSONDecodeError:
            print("Failed to decode JSON response from vector query.")
            return []
    else:
        print(f"Vector query failed. Status Code: {response.status_code}")
        print(response.text)
        return []

def get_metadata_by_ids(ids):
    """Fetch metadata for the given vector IDs from the Cloudflare Vectorize API."""
    url = "https://api.cloudflare.com/client/v4/accounts/account-id/vectorize/v2/indexes/index-name/get_by_ids"
    headers = {
        "Authorization": "Bearer TOKEN",
        "Content-Type": "application/json"
    }
    payload = {
        "ids": ids
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        try:
            response_data = response.json()
            metadata_list = [item.get("metadata") for item in response_data.get("result", [])]
            return metadata_list
        except json.JSONDecodeError:
            print("Failed to decode JSON response from metadata query.")
            return []
    else:
        print(f"Metadata query failed. Status Code: {response.status_code}")
        print(response.text)
        return []

def main():
    vector_ids = get_vector_ids()
    if vector_ids:
        print(f"Retrieved {len(vector_ids)} vector IDs.")
        metadata_list = get_metadata_by_ids(vector_ids)
        print("Metadata:")
        print(json.dumps(metadata_list, indent=2))
    else:
        print("No vector IDs retrieved.")

if __name__ == "__main__":
    main()
