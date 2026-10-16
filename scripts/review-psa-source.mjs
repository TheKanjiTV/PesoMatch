import { writeFile } from "node:fs/promises"
const url =
  "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1B/LFS/0021B3FKEI2.px"
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  console.log("PSA public metadata status:", response.status)
  if (response.ok) {
    const data = await response.json()
    await writeFile(
      new URL("../.local/source-review/psa-metadata.json", import.meta.url),
      JSON.stringify(data, null, 2),
    )
    console.log(JSON.stringify(data))
    const selections = {
      Year: ["2026"],
      Month: ["August"],
      Rates: [
        "Labor Force Participation Rate",
        "Employment Rate",
        "Unemployment Rate",
        "Underemployment Rate",
      ],
      Sex: ["Both sexes"],
    }
    const query = data.variables.map((variable) => ({
      code: variable.code,
      selection: {
        filter: "item",
        values: selections[variable.code].map(
          (label) => variable.values[variable.valueTexts.indexOf(label)],
        ),
      },
    }))
    const valuesResponse = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, response: { format: "json" } }),
    })
    console.log(
      "PSA read-only statistical query status:",
      valuesResponse.status,
    )
    if (valuesResponse.ok) {
      const values = await valuesResponse.json()
      await writeFile(
        new URL("../.local/source-review/psa-rates.json", import.meta.url),
        JSON.stringify(values, null, 2),
      )
      console.log(JSON.stringify(values))
    }
  }
} catch (error) {
  console.log("Public metadata retrieval:", error.name)
}
