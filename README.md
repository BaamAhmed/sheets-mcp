<div align="center">
  <b>mcp-google-sheets</b>

  <p align="center">
    <i>Your AI Assistant's Gateway to Google Sheets!</i> 📊
  </p>

![GitHub License](https://img.shields.io/github/license/xing5/mcp-google-sheets)
</div>

---

## 🤔 What is this?

`mcp-google-sheets` is a TypeScript-based MCP server that acts as a bridge between any MCP-compatible client (like Claude Desktop, Cursor, or ChatGPT) and the Google Sheets API. It allows you to interact with your Google Spreadsheets using a defined set of tools, enabling powerful automation and data manipulation workflows driven by AI.

**This server is designed to be deployed on Vercel** for easy, serverless hosting with global distribution.

---

## 🚀 Quick Start

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxing5%2Fmcp-google-sheets&env=CREDENTIALS_CONFIG,DRIVE_FOLDER_ID&envDescription=Google%20Cloud%20credentials%20for%20Sheets%20API%20access)

1. Click the button above to deploy
2. Set the required environment variables (see [Configuration](#-configuration))
3. Connect your MCP client to `https://your-deployment.vercel.app/api/mcp`

### Local Development

```bash
# Clone the repository
git clone https://github.com/xing5/mcp-google-sheets.git
cd mcp-google-sheets

# Install dependencies
npm install

# Set environment variables
export CREDENTIALS_CONFIG="your-base64-encoded-credentials"
# OR
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
# OR
export GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Run development server
npm run dev
```

The MCP endpoint will be available at `http://localhost:3000/api/mcp`

---

## ✨ Key Features

- **Seamless Integration:** Connects directly to Google Drive & Google Sheets APIs
- **Comprehensive Tools:** Offers a wide range of operations (CRUD, listing, batching, sharing, formatting, etc.)
- **Flexible Authentication:** Supports multiple credential formats (Base64, JSON string, individual fields)
- **Serverless Deployment:** Built for Vercel with edge runtime support
- **AI-Ready:** Designed for use with MCP-compatible clients

---

## 🔧 Configuration

### Environment Variables

Set one of the following authentication methods:

| Variable | Description |
|:---------|:------------|
| `CREDENTIALS_CONFIG` | Base64-encoded service account JSON (recommended for Vercel) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Direct JSON string of service account credentials |
| `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY` | Individual service account fields |
| `DRIVE_FOLDER_ID` | Default Google Drive folder ID (optional) |

### Setting up Google Cloud Credentials

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable APIs**
   - Navigate to "APIs & Services" → "Library"
   - Enable **Google Sheets API** and **Google Drive API**

3. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "+ CREATE SERVICE ACCOUNT"
   - Name it (e.g., `mcp-sheets-service`)
   - Grant the **Editor** role
   - Click "Done", then find the account and click "Manage keys"
   - Click "ADD KEY" → "Create new key" → **JSON**
   - Download the JSON key file

4. **Share Drive Folder (Optional)**
   - Create a folder in Google Drive
   - Share it with your service account email (found in the JSON as `client_email`)
   - Note the folder ID from the URL

5. **Encode Credentials for Vercel**
   ```bash
   # macOS/Linux
   base64 -w 0 your-service-account-key.json
   
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("your-service-account-key.json"))
   ```
   
   Set the output as `CREDENTIALS_CONFIG` in Vercel

---

## 🛠️ Available Tools

| Tool | Description |
|:-----|:------------|
| `list_spreadsheets` | List spreadsheets in a Drive folder |
| `create_spreadsheet` | Create a new spreadsheet |
| `get_sheet_data` | Read data from a range |
| `get_sheet_formulas` | Read formulas from a range |
| `update_cells` | Write data to a range |
| `batch_update_cells` | Update multiple ranges at once |
| `add_rows` | Insert empty rows |
| `add_columns` | Insert empty columns |
| `list_sheets` | List all sheet tabs |
| `create_sheet` | Create a new sheet tab |
| `copy_sheet` | Copy a sheet between spreadsheets |
| `rename_sheet` | Rename a sheet tab |
| `get_multiple_sheet_data` | Fetch from multiple ranges |
| `get_multiple_spreadsheet_summary` | Get summaries of multiple spreadsheets |
| `share_spreadsheet` | Share with users |
| `list_folders` | List Drive folders |
| `batch_update` | Execute any batchUpdate operation |

### MCP Resources

| Resource | Description |
|:---------|:------------|
| `spreadsheet://{spreadsheet_id}/info` | Get spreadsheet metadata |

---

## 🔌 Client Configuration

### Cursor

Add to your MCP settings:

```json
{
  "mcpServers": {
    "google-sheets": {
      "url": "https://your-deployment.vercel.app/api/mcp"
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-sheets": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "transport": "sse"
    }
  }
}
```

### VS Code with Copilot

1. Open Command Palette
2. Run "MCP: Add Server"
3. Select "HTTP"
4. Enter URL: `https://your-deployment.vercel.app/api/mcp`
5. Name: `google-sheets`

---

## 💬 Example Prompts

Once connected, try prompts like:

- "List all spreadsheets I have access to."
- "Create a new spreadsheet titled 'Quarterly Sales Report Q3 2024'."
- "Get the data from Sheet1 range A1 to E10 in spreadsheet ID abc123."
- "Add a new sheet named 'Summary' to spreadsheet abc123."
- "Update cell B2 in Sheet 'Tasks' to 'In Progress'."
- "Share the spreadsheet with user@example.com as a writer."

---

## 🆔 ID Reference Guide

```
Google Drive Folder ID:
  https://drive.google.com/drive/folders/1xcRQCU9xrNVBPTeNzHqx4hrG7yR91WIa
                                          └────────── Folder ID ──────────┘

Google Sheets Spreadsheet ID:
  https://docs.google.com/spreadsheets/d/25_-_raTaKjaVxu9nJzA7-FCrNhnkd3cXC54BPAOXemI/edit
                                         └───────────── Spreadsheet ID ─────────────┘
```

---

## 📁 Project Structure

```
mcp-google-sheets/
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts      # MCP endpoint handler
│   ├── layout.tsx            # Next.js layout
│   └── page.tsx              # Info page
├── lib/
│   ├── google-auth.ts        # Google API authentication
│   └── sheets-tools.ts       # Tool implementations
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss bugs or feature requests. Pull requests are appreciated.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

- Built with [Vercel MCP Adapter](https://vercel.com/docs/mcp)
- Uses [googleapis](https://www.npmjs.com/package/googleapis) for Google API integration
- Inspired by [kazz187/mcp-google-spreadsheet](https://github.com/kazz187/mcp-google-spreadsheet)
