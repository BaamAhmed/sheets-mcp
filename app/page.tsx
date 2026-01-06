export default function Home() {
  return (
    <main
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: 1.6,
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "#0a0a0a",
        }}
      >
        📊 MCP Google Sheets Server
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        A Model Context Protocol (MCP) server for interacting with Google
        Sheets.
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "#0a0a0a",
          }}
        >
          MCP Endpoint
        </h2>
        <code
          style={{
            backgroundColor: "#f4f4f5",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            display: "block",
            color: "#18181b",
          }}
        >
          {typeof window !== "undefined"
            ? `${window.location.origin}/api/mcp`
            : "/api/mcp"}
        </code>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "#0a0a0a",
          }}
        >
          Available Tools
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gap: "0.5rem",
          }}
        >
          {[
            "get_sheet_data",
            "get_sheet_formulas",
            "update_cells",
            "batch_update_cells",
            "add_rows",
            "add_columns",
            "list_sheets",
            "copy_sheet",
            "rename_sheet",
            "get_multiple_sheet_data",
            "get_multiple_spreadsheet_summary",
            "create_spreadsheet",
            "create_sheet",
            "list_spreadsheets",
            "share_spreadsheet",
            "list_folders",
            "batch_update",
          ].map((tool) => (
            <li
              key={tool}
              style={{
                backgroundColor: "#f4f4f5",
                padding: "0.25rem 0.75rem",
                borderRadius: "4px",
                fontSize: "0.875rem",
                display: "inline-block",
                marginRight: "0.5rem",
                marginBottom: "0.25rem",
              }}
            >
              {tool}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "#0a0a0a",
          }}
        >
          Configuration
        </h2>
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          Set the following environment variables in your Vercel project:
        </p>
        <ul
          style={{
            listStyle: "disc",
            paddingLeft: "1.5rem",
            color: "#666",
            fontSize: "0.875rem",
          }}
        >
          <li>
            <code>CREDENTIALS_CONFIG</code> - Base64 encoded service account
            JSON
          </li>
          <li>
            <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> - Direct JSON string (alt)
          </li>
          <li>
            <code>GOOGLE_CLIENT_EMAIL</code> + <code>GOOGLE_PRIVATE_KEY</code> -
            Individual fields (alt)
          </li>
          <li>
            <code>DRIVE_FOLDER_ID</code> - Default folder ID (optional)
          </li>
        </ul>
      </section>
    </main>
  );
}

