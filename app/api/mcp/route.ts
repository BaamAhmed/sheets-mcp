import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import {
  getSheetData,
  getSheetDataSchema,
  getSheetFormulas,
  getSheetFormulasSchema,
  updateCells,
  updateCellsSchema,
  batchUpdateCells,
  batchUpdateCellsSchema,
  addRows,
  addRowsSchema,
  addColumns,
  addColumnsSchema,
  listSheets,
  listSheetsSchema,
  copySheet,
  copySheetSchema,
  renameSheet,
  renameSheetSchema,
  getMultipleSheetData,
  getMultipleSheetDataSchema,
  getMultipleSpreadsheetSummary,
  getMultipleSpreadsheetSummarySchema,
  createSpreadsheet,
  createSpreadsheetSchema,
  createSheet,
  createSheetSchema,
  listSpreadsheets,
  listSpreadsheetsSchema,
  shareSpreadsheet,
  shareSpreadsheetSchema,
  listFolders,
  listFoldersSchema,
  batchUpdate,
  batchUpdateSchema,
} from "@/lib/sheets-tools";
import { getGoogleServices } from "@/lib/google-auth";

// MCP Handler for Google Sheets
const handler = createMcpHandler(
  (server) => {
    // Register tools using the tool() API
    server.tool(
      "get_sheet_data",
      "Get data from a specific sheet in a Google Spreadsheet. Returns cell values from the specified range or entire sheet.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        sheet: z.string().describe("The name of the sheet"),
        range: z.string().optional().describe("Optional cell range in A1 notation (e.g., 'A1:C10'). If not provided, gets all data."),
        include_grid_data: z.boolean().optional().default(false).describe(
          "If true, includes cell formatting and other metadata. Default is false (returns values only, more efficient)."
        ),
      },
      async (args) => {
        const result = await getSheetData(args as z.infer<typeof getSheetDataSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "get_sheet_formulas",
      "Get formulas from a specific sheet in a Google Spreadsheet. Returns formulas (not values) from the specified range.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        sheet: z.string().describe("The name of the sheet"),
        range: z.string().optional().describe("Optional cell range in A1 notation. If not provided, gets all formulas from the sheet."),
      },
      async (args) => {
        const result = await getSheetFormulas(args as z.infer<typeof getSheetFormulasSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "update_cells",
      "Update cells in a Google Spreadsheet. Overwrites existing data in the specified range with new values.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        sheet: z.string().describe("The name of the sheet"),
        range: z.string().describe("Cell range in A1 notation (e.g., 'A1:C10')"),
        data: z.array(z.array(z.unknown())).describe("2D array of values to update"),
      },
      async (args) => {
        const result = await updateCells(args as z.infer<typeof updateCellsSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "batch_update_cells",
      "Batch update multiple ranges in a Google Spreadsheet. Efficiently updates multiple ranges in a single API call.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        sheet: z.string().describe("The name of the sheet"),
        ranges: z.record(z.string(), z.array(z.array(z.unknown()))).describe(
          "Dictionary mapping range strings to 2D arrays of values"
        ),
      },
      async (args) => {
        const result = await batchUpdateCells(args as z.infer<typeof batchUpdateCellsSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "add_rows",
      "Add rows to a sheet in a Google Spreadsheet. Inserts empty rows at the specified position.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        sheet: z.string().describe("The name of the sheet"),
        count: z.number().describe("Number of rows to add"),
        start_row: z.number().optional().describe("0-based row index to start adding. If not provided, adds at the beginning."),
      },
      async (args) => {
        const result = await addRows(args as z.infer<typeof addRowsSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "add_columns",
      "Add columns to a sheet in a Google Spreadsheet. Inserts empty columns at the specified position.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        sheet: z.string().describe("The name of the sheet"),
        count: z.number().describe("Number of columns to add"),
        start_column: z.number().optional().describe("0-based column index to start adding. If not provided, adds at the beginning."),
      },
      async (args) => {
        const result = await addColumns(args as z.infer<typeof addColumnsSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "list_sheets",
      "List all sheets (tabs) in a Google Spreadsheet. Returns the names of all sheets in the spreadsheet.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
      },
      async (args) => {
        const result = await listSheets(args as z.infer<typeof listSheetsSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "copy_sheet",
      "Copy a sheet from one spreadsheet to another. Duplicates the sheet and optionally renames it.",
      {
        src_spreadsheet: z.string().describe("Source spreadsheet ID"),
        src_sheet: z.string().describe("Source sheet name"),
        dst_spreadsheet: z.string().describe("Destination spreadsheet ID"),
        dst_sheet: z.string().describe("Destination sheet name"),
      },
      async (args) => {
        const result = await copySheet(args as z.infer<typeof copySheetSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "rename_sheet",
      "Rename a sheet in a Google Spreadsheet. Changes the name of an existing sheet tab.",
      {
        spreadsheet: z.string().describe("Spreadsheet ID"),
        sheet: z.string().describe("Current sheet name"),
        new_name: z.string().describe("New sheet name"),
      },
      async (args) => {
        const result = await renameSheet(args as z.infer<typeof renameSheetSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "get_multiple_sheet_data",
      "Get data from multiple specific ranges in Google Spreadsheets. Fetches data from multiple ranges across potentially different spreadsheets.",
      {
        queries: z.array(z.object({
          spreadsheet_id: z.string(),
          sheet: z.string(),
          range: z.string(),
        })).describe("List of queries with spreadsheet_id, sheet, and range"),
      },
      async (args) => {
        const result = await getMultipleSheetData(args as z.infer<typeof getMultipleSheetDataSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "get_multiple_spreadsheet_summary",
      "Get a summary of multiple Google Spreadsheets. Returns titles, sheet names, headers, and first few rows for each spreadsheet.",
      {
        spreadsheet_ids: z.array(z.string()).describe("List of spreadsheet IDs to summarize"),
        rows_to_fetch: z.number().optional().default(5).describe("Number of rows to fetch for the summary (default: 5)"),
      },
      async (args) => {
        const result = await getMultipleSpreadsheetSummary(args as z.infer<typeof getMultipleSpreadsheetSummarySchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "create_spreadsheet",
      "Create a new Google Spreadsheet. Creates a new spreadsheet in the specified folder or root.",
      {
        title: z.string().describe("The title of the new spreadsheet"),
        folder_id: z.string().optional().describe("Optional Google Drive folder ID where the spreadsheet should be created"),
      },
      async (args) => {
        const result = await createSpreadsheet(args as z.infer<typeof createSpreadsheetSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "create_sheet",
      "Create a new sheet (tab) in an existing Google Spreadsheet. Adds a new sheet with the specified name.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet"),
        title: z.string().describe("The title for the new sheet"),
      },
      async (args) => {
        const result = await createSheet(args as z.infer<typeof createSheetSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "list_spreadsheets",
      "List all spreadsheets in the specified Google Drive folder. Returns spreadsheet IDs and titles.",
      {
        folder_id: z.string().optional().describe("Optional Google Drive folder ID to search in"),
      },
      async (args) => {
        const result = await listSpreadsheets(args as z.infer<typeof listSpreadsheetsSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "share_spreadsheet",
      "Share a Google Spreadsheet with multiple users via email. Assigns specific roles (reader, commenter, writer) to each recipient.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet to share"),
        recipients: z.array(z.object({
          email_address: z.string(),
          role: z.enum(["reader", "commenter", "writer"]),
        })).describe("List of recipients with email and role"),
        send_notification: z.boolean().optional().default(true).describe("Whether to send notification email"),
      },
      async (args) => {
        const result = await shareSpreadsheet(args as z.infer<typeof shareSpreadsheetSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "list_folders",
      "List all folders in the specified Google Drive folder. Returns folder IDs, names, and parent information.",
      {
        parent_folder_id: z.string().optional().describe("Optional parent folder ID to search within"),
      },
      async (args) => {
        const result = await listFolders(args as z.infer<typeof listFoldersSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "batch_update",
      "Execute a batch update on a Google Spreadsheet. Provides access to all batchUpdate operations including adding sheets, updating properties, inserting/deleting dimensions, formatting, and more.",
      {
        spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
        requests: z.array(z.record(z.unknown())).describe("List of batchUpdate request objects"),
      },
      async (args) => {
        const result = await batchUpdate(args as z.infer<typeof batchUpdateSchema>);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    // Register resource for spreadsheet info
    server.resource(
      "spreadsheet_info",
      "spreadsheet://{spreadsheet_id}/info",
      { description: "Get basic information about a Google Spreadsheet" },
      async (uri) => {
        // Extract spreadsheet_id from the URI
        const match = uri.href.match(/spreadsheet:\/\/([^/]+)\/info/);
        const spreadsheetId = match?.[1];

        if (!spreadsheetId) {
          throw new Error("Invalid spreadsheet URI format");
        }

        const services = await getGoogleServices();
        const response = await services.sheets.spreadsheets.get({
          spreadsheetId,
        });

        const info = {
          title: response.data.properties?.title || "Unknown",
          sheets: response.data.sheets?.map((sheet) => ({
            title: sheet.properties?.title,
            sheetId: sheet.properties?.sheetId,
            gridProperties: sheet.properties?.gridProperties || {},
          })),
        };

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }
    );
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
  {
    basePath: "/api",
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };
