/**
Copyright 2021 Forestry.io Holdings, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import fetchPonyfill from 'fetch-ponyfill'
const { fetch, Headers } = fetchPonyfill()

export interface TinaClientArgs<GenQueries = Record<string, unknown>> {
  url: string
  token?: string
  queries?: (client: TinaClient<GenQueries>) => GenQueries
}
export type TinaClientRequestArgs = {
  variables?: Record<string, any>
  query: string
} & Partial<Omit<TinaClientArgs, 'queries'>>
export class TinaClient<GenQueries> {
  public apiUrl: string
  public readonlyToken?: string
  /**
   *
   */
  public queries?: GenQueries
  constructor({ token, url, queries }: TinaClientArgs<GenQueries>) {
    this.apiUrl = url
    this.readonlyToken = token
    if (queries) {
      this.queries = queries(this)
    }
  }

  public async request<DataType extends Record<string, any> = any>(
    args: TinaClientRequestArgs
  ): Promise<{ data: DataType; query: string }> {
    let data: DataType = {} as DataType
    const headers = new Headers()
    if (this.readonlyToken) {
      headers.append('X-API-KEY', this.readonlyToken)
    }
    headers.append('Content-Type', 'application/json')

    const bodyString = JSON.stringify({
      query: args.query,
      variables: args?.variables || {},
    })
    const url = args?.url || this.apiUrl

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString,
      redirect: 'follow',
    })
    const json = await res.json()
    if (json.errors) {
      throw new Error(
        `Unable to fetch, errors: \n\t${json.errors
          .map((error) => error.message)
          .join('\n')}`
      )
    }
    return {
      data: json?.data as DataType,
      query: args.query,
    }
  }
}

export function createClient<GenQueries>(args: TinaClientArgs<GenQueries>) {
  const client = new TinaClient<ReturnType<typeof args.queries>>(args)
  return client
}