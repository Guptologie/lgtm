interface GraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

export async function executeQuery(
  query: string,
  token: string,
  variables?: Record<string, unknown>
): Promise<any> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "lgtm-dashboard",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const json: GraphQLResponse = await response.json();

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  return json.data;
}
