# Accessing the Envio GraphQL Endpoint from Another Backend

## GraphQL Endpoint Information

- **URL**: `http://localhost:8080/v1/graphql`
- **Method**: POST
- **Content-Type**: `application/json`
- **Authentication**: None (for local development)

## Important: Network Access

### For Local Development (Same Machine)
- Use: `http://localhost:8080/v1/graphql`

### For Access from Another Machine/Container
- Use: `http://<YOUR_SERVER_IP>:8080/v1/graphql`
- Example: `http://192.168.1.100:8080/v1/graphql`

### For Docker Container Access
If your backend is in a Docker container, use:
- `http://host.docker.internal:8080/v1/graphql` (Mac/Windows)
- Or use the host machine's IP address

---

## 1. Node.js / TypeScript (Recommended)

### Using `graphql-request` (Simplest)

```bash
npm install graphql-request graphql
```

```typescript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('http://localhost:8080/v1/graphql');

// Query a user's lending history
async function getUserLendingHistory(walletAddress: string) {
  const query = gql`
    query GetUserHistory($address: String!) {
      user(id: $address) {
        id
        totalBorrowsUSD
        totalSuppliesUSD
        totalLiquidations
      }
      
      borrowEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: 50
      ) {
        protocol
        asset
        amount
        amountUSD
        timestamp
        blockNumber
      }
      
      liquidationEvents(
        where: { user_id: { _eq: $address } }
        orderBy: { timestamp: desc }
      ) {
        protocol
        collateralAsset
        debtAsset
        liquidatedCollateralAmount
        liquidatedCollateralUSD
        timestamp
      }
    }
  `;

  const variables = {
    address: walletAddress.toLowerCase(), // Important: use lowercase!
  };

  const data = await client.request(query, variables);
  return data;
}

// Usage
getUserLendingHistory('0x742d35cc6634c0532925a3b844bc9e7595f0beb')
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Using `fetch` (Native)

```typescript
async function queryGraphQL(query: string, variables?: any) {
  const response = await fetch('http://localhost:8080/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Usage example
const query = `
  query GetUser($address: String!) {
    user(id: $address) {
      id
      totalBorrowsUSD
      totalSuppliesUSD
      totalLiquidations
    }
  }
`;

const data = await queryGraphQL(query, { 
  address: '0x742d35cc6634c0532925a3b844bc9e7595f0beb' 
});
```

---

## 2. Python (FastAPI / Flask)

### Using `requests`

```bash
pip install requests
```

```python
import requests
import json

GRAPHQL_ENDPOINT = "http://localhost:8080/v1/graphql"

def query_graphql(query: str, variables: dict = None):
    """Execute a GraphQL query"""
    response = requests.post(
        GRAPHQL_ENDPOINT,
        json={
            "query": query,
            "variables": variables or {}
        },
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        raise Exception(f"Query failed: {response.status_code} {response.text}")
    
    result = response.json()
    
    if "errors" in result:
        raise Exception(f"GraphQL errors: {result['errors']}")
    
    return result["data"]

# Example: Get user lending history
def get_user_lending_history(wallet_address: str):
    query = """
        query GetUserHistory($address: String!) {
            user(id: $address) {
                id
                totalBorrowsUSD
                totalSuppliesUSD
                totalLiquidations
            }
            
            borrowEvents(
                where: { user: { _eq: $address } }
                orderBy: { timestamp: desc }
                limit: 50
            ) {
                protocol
                asset
                amount
                amountUSD
                timestamp
                blockNumber
            }
        }
    """
    
    variables = {
        "address": wallet_address.lower()  # Important: use lowercase!
    }
    
    return query_graphql(query, variables)

# Usage
if __name__ == "__main__":
    data = get_user_lending_history("0x742d35cc6634c0532925a3b844bc9e7595f0beb")
    print(json.dumps(data, indent=2))
```

### FastAPI Integration

```python
from fastapi import FastAPI, HTTPException
import requests

app = FastAPI()

GRAPHQL_ENDPOINT = "http://localhost:8080/v1/graphql"

@app.get("/api/user/{wallet_address}/lending-history")
async def get_lending_history(wallet_address: str):
    query = """
        query GetUserHistory($address: String!) {
            user(id: $address) {
                id
                totalBorrowsUSD
                totalSuppliesUSD
                totalLiquidations
            }
            borrowEvents(where: { user: { _eq: $address } }) {
                protocol
                asset
                amount
                timestamp
            }
        }
    """
    
    try:
        response = requests.post(
            GRAPHQL_ENDPOINT,
            json={
                "query": query,
                "variables": {"address": wallet_address.lower()}
            }
        )
        response.raise_for_status()
        data = response.json()
        
        if "errors" in data:
            raise HTTPException(status_code=400, detail=data["errors"])
        
        return data["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 3. Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "strings"
)

const graphqlEndpoint = "http://localhost:8080/v1/graphql"

type GraphQLRequest struct {
    Query     string                 `json:"query"`
    Variables map[string]interface{} `json:"variables,omitempty"`
}

type GraphQLResponse struct {
    Data   json.RawMessage `json:"data"`
    Errors []struct {
        Message string `json:"message"`
    } `json:"errors,omitempty"`
}

func queryGraphQL(query string, variables map[string]interface{}) (json.RawMessage, error) {
    reqBody := GraphQLRequest{
        Query:     query,
        Variables: variables,
    }

    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return nil, err
    }

    resp, err := http.Post(graphqlEndpoint, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var result GraphQLResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, err
    }

    if len(result.Errors) > 0 {
        return nil, fmt.Errorf("GraphQL errors: %v", result.Errors)
    }

    return result.Data, nil
}

func getUserLendingHistory(walletAddress string) (json.RawMessage, error) {
    query := `
        query GetUserHistory($address: String!) {
            user(id: $address) {
                id
                totalBorrowsUSD
                totalSuppliesUSD
                totalLiquidations
            }
            borrowEvents(where: { user: { _eq: $address } }) {
                protocol
                asset
                amount
                timestamp
            }
        }
    `

    variables := map[string]interface{}{
        "address": strings.ToLower(walletAddress),
    }

    return queryGraphQL(query, variables)
}

func main() {
    data, err := getUserLendingHistory("0x742d35cc6634c0532925a3b844bc9e7595f0beb")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    fmt.Println(string(data))
}
```

---

## 4. PHP

```php
<?php

function queryGraphQL($query, $variables = []) {
    $endpoint = 'http://localhost:8080/v1/graphql';
    
    $data = [
        'query' => $query,
        'variables' => $variables
    ];
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($endpoint, false, $context);
    
    if ($result === false) {
        throw new Exception("Failed to query GraphQL endpoint");
    }
    
    $response = json_decode($result, true);
    
    if (isset($response['errors'])) {
        throw new Exception("GraphQL errors: " . json_encode($response['errors']));
    }
    
    return $response['data'];
}

function getUserLendingHistory($walletAddress) {
    $query = <<<'GRAPHQL'
        query GetUserHistory($address: String!) {
            user(id: $address) {
                id
                totalBorrowsUSD
                totalSuppliesUSD
                totalLiquidations
            }
            borrowEvents(where: { user: { _eq: $address } }) {
                protocol
                asset
                amount
                timestamp
            }
        }
GRAPHQL;

    $variables = [
        'address' => strtolower($walletAddress)
    ];
    
    return queryGraphQL($query, $variables);
}

// Usage
try {
    $data = getUserLendingHistory("0x742d35cc6634c0532925a3b844bc9e7595f0beb");
    echo json_encode($data, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
```

---

## 5. Rust

```rust
use reqwest;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize)]
struct GraphQLRequest {
    query: String,
    variables: serde_json::Value,
}

#[derive(Deserialize)]
struct GraphQLResponse {
    data: Option<serde_json::Value>,
    errors: Option<Vec<serde_json::Value>>,
}

async fn query_graphql(
    query: &str,
    variables: serde_json::Value,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    
    let request = GraphQLRequest {
        query: query.to_string(),
        variables,
    };
    
    let response = client
        .post("http://localhost:8080/v1/graphql")
        .json(&request)
        .send()
        .await?
        .json::<GraphQLResponse>()
        .await?;
    
    if let Some(errors) = response.errors {
        return Err(format!("GraphQL errors: {:?}", errors).into());
    }
    
    Ok(response.data.unwrap())
}

async fn get_user_lending_history(
    wallet_address: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let query = r#"
        query GetUserHistory($address: String!) {
            user(id: $address) {
                id
                totalBorrowsUSD
                totalSuppliesUSD
                totalLiquidations
            }
            borrowEvents(where: { user: { _eq: $address } }) {
                protocol
                asset
                amount
                timestamp
            }
        }
    "#;
    
    let variables = json!({
        "address": wallet_address.to_lowercase()
    });
    
    query_graphql(query, variables).await
}

#[tokio::main]
async fn main() {
    match get_user_lending_history("0x742d35cc6634c0532925a3b844bc9e7595f0beb").await {
        Ok(data) => println!("{}", serde_json::to_string_pretty(&data).unwrap()),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

---

## Common Query Examples

### 1. Get All Liquidations

```graphql
query GetAllLiquidations {
  liquidationEvents(
    orderBy: { timestamp: desc }
    limit: 100
  ) {
    user_id
    liquidator
    protocol
    collateralAsset
    debtAsset
    liquidatedCollateralAmount
    liquidatedCollateralUSD
    timestamp
  }
}
```

### 2. Get Protocol Statistics

```graphql
query GetProtocolStats {
  borrowEvents_aggregate {
    aggregate {
      count
      sum {
        amountUSD
      }
    }
  }
  
  liquidationEvents_aggregate(where: { protocol: { _eq: "AAVE_V3" } }) {
    aggregate {
      count
      sum {
        liquidatedCollateralUSD
      }
    }
  }
}
```

### 3. Search for High-Value Liquidations

```graphql
query HighValueLiquidations {
  liquidationEvents(
    where: { liquidatedCollateralUSD: { _gt: "1000000000000000000000" } }
    orderBy: { liquidatedCollateralUSD: desc }
    limit: 10
  ) {
    user_id
    protocol
    liquidatedCollateralUSD
    timestamp
    blockNumber
  }
}
```

---

## Important Notes

### 1. Address Format
**Always use lowercase addresses in queries!**

```javascript
// Good ✅
const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb";

// Bad ❌
const address = "0x742D35CC6634C0532925A3B844BC9E7595F0BEB";
```

### 2. Error Handling
Always check for errors in the GraphQL response:

```javascript
const result = await response.json();
if (result.errors) {
  console.error('GraphQL Errors:', result.errors);
  throw new Error('Query failed');
}
```

### 3. Pagination
For large datasets, use pagination:

```graphql
query GetPaginatedBorrows($offset: Int!, $limit: Int!) {
  borrowEvents(
    offset: $offset
    limit: $limit
    orderBy: { timestamp: desc }
  ) {
    id
    user
    amount
  }
}
```

### 4. Production Deployment
When deploying to production:
- Replace `localhost:8080` with your server's URL
- Add authentication if needed
- Use environment variables for the endpoint URL
- Implement rate limiting
- Add caching for frequently accessed data

---

## Testing Your Connection

Use this simple cURL command to test:

```bash
curl -X POST http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { users(limit: 5) { id totalBorrowsUSD } }"
  }'
```

You should see a JSON response with user data!
