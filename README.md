# ViaQuery

ViaQuery searches live job openings across supported ATS providers and keeps job application tracking in your browser.

## Company datasets

Upload a `.csv` or `.xlsx` file with a `Company` column and an `ATS Type` column. CSV files can also use the `ATS` header. An optional `Job URL` column can provide a company-specific job board URL.

Excel workbooks may contain multiple sheets. Each sheet is read and combined; if a row has no ATS value, its sheet name is used as the ATS type. For example, sheets named `Greenhouse`, `Ashby`, `Lever`, `SmartRecruiters`, and `Internals` can each list companies under `Company`.

Uploads are processed in the browser, limited to 5 MB and 3,000 companies, and are not uploaded to a ViaQuery server. A dark theme is available from the theme button in the header and its preference is saved in local browser storage.

## Development

```sh
npm install
npm run dev
```

## Checks

```sh
npm run build
npm run lint
```
