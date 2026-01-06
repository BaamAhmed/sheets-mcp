import { z } from "zod";
import { getGoogleServices, GoogleServices } from "./google-auth";

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export const getSheetDataSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  sheet: z.string().describe("The name of the sheet"),
  range: z.string().optional().describe("Optional cell range in A1 notation (e.g., 'A1:C10'). If not provided, gets all data."),
  include_grid_data: z.boolean().optional().default(false).describe(
    "If true, includes cell formatting and other metadata. Default is false (returns values only, more efficient)."
  ),
});

export const getSheetFormulasSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  sheet: z.string().describe("The name of the sheet"),
  range: z.string().optional().describe("Optional cell range in A1 notation. If not provided, gets all formulas from the sheet."),
});

export const updateCellsSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  sheet: z.string().describe("The name of the sheet"),
  range: z.string().describe("Cell range in A1 notation (e.g., 'A1:C10')"),
  data: z.array(z.array(z.unknown())).describe("2D array of values to update"),
});

export const batchUpdateCellsSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  sheet: z.string().describe("The name of the sheet"),
  ranges: z.record(z.string(), z.array(z.array(z.unknown()))).describe(
    "Dictionary mapping range strings to 2D arrays of values"
  ),
});

export const addRowsSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  sheet: z.string().describe("The name of the sheet"),
  count: z.number().describe("Number of rows to add"),
  start_row: z.number().optional().describe("0-based row index to start adding. If not provided, adds at the beginning."),
});

export const addColumnsSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  sheet: z.string().describe("The name of the sheet"),
  count: z.number().describe("Number of columns to add"),
  start_column: z.number().optional().describe("0-based column index to start adding. If not provided, adds at the beginning."),
});

export const listSheetsSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
});

export const copySheetSchema = z.object({
  src_spreadsheet: z.string().describe("Source spreadsheet ID"),
  src_sheet: z.string().describe("Source sheet name"),
  dst_spreadsheet: z.string().describe("Destination spreadsheet ID"),
  dst_sheet: z.string().describe("Destination sheet name"),
});

export const renameSheetSchema = z.object({
  spreadsheet: z.string().describe("Spreadsheet ID"),
  sheet: z.string().describe("Current sheet name"),
  new_name: z.string().describe("New sheet name"),
});

export const getMultipleSheetDataSchema = z.object({
  queries: z.array(z.object({
    spreadsheet_id: z.string(),
    sheet: z.string(),
    range: z.string(),
  })).describe("List of queries with spreadsheet_id, sheet, and range"),
});

export const getMultipleSpreadsheetSummarySchema = z.object({
  spreadsheet_ids: z.array(z.string()).describe("List of spreadsheet IDs to summarize"),
  rows_to_fetch: z.number().optional().default(5).describe("Number of rows to fetch for the summary (default: 5)"),
});

export const createSpreadsheetSchema = z.object({
  title: z.string().describe("The title of the new spreadsheet"),
  folder_id: z.string().optional().describe("Optional Google Drive folder ID where the spreadsheet should be created"),
});

export const createSheetSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet"),
  title: z.string().describe("The title for the new sheet"),
});

export const listSpreadsheetsSchema = z.object({
  folder_id: z.string().optional().describe("Optional Google Drive folder ID to search in"),
});

export const shareSpreadsheetSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet to share"),
  recipients: z.array(z.object({
    email_address: z.string(),
    role: z.enum(["reader", "commenter", "writer"]),
  })).describe("List of recipients with email and role"),
  send_notification: z.boolean().optional().default(true).describe("Whether to send notification email"),
});

export const listFoldersSchema = z.object({
  parent_folder_id: z.string().optional().describe("Optional parent folder ID to search within"),
});

export const batchUpdateSchema = z.object({
  spreadsheet_id: z.string().describe("The ID of the spreadsheet (found in the URL)"),
  requests: z.array(z.record(z.unknown())).describe("List of batchUpdate request objects"),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSheetId(
  services: GoogleServices,
  spreadsheetId: string,
  sheetName: string
): Promise<number | null> {
  const response = await services.sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheet = response.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );

  return sheet?.properties?.sheetId ?? null;
}

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

export async function getSheetData(
  args: z.infer<typeof getSheetDataSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const fullRange = args.range ? `${args.sheet}!${args.range}` : args.sheet;

  if (args.include_grid_data) {
    const response = await services.sheets.spreadsheets.get({
      spreadsheetId: args.spreadsheet_id,
      ranges: [fullRange],
      includeGridData: true,
    });
    return response.data;
  } else {
    const response = await services.sheets.spreadsheets.values.get({
      spreadsheetId: args.spreadsheet_id,
      range: fullRange,
    });
    return {
      spreadsheetId: args.spreadsheet_id,
      valueRanges: [
        {
          range: fullRange,
          values: response.data.values || [],
        },
      ],
    };
  }
}

export async function getSheetFormulas(
  args: z.infer<typeof getSheetFormulasSchema>
): Promise<unknown[][]> {
  const services = await getGoogleServices();
  const fullRange = args.range ? `${args.sheet}!${args.range}` : args.sheet;

  const response = await services.sheets.spreadsheets.values.get({
    spreadsheetId: args.spreadsheet_id,
    range: fullRange,
    valueRenderOption: "FORMULA",
  });

  return (response.data.values as unknown[][]) || [];
}

export async function updateCells(
  args: z.infer<typeof updateCellsSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const fullRange = `${args.sheet}!${args.range}`;

  const response = await services.sheets.spreadsheets.values.update({
    spreadsheetId: args.spreadsheet_id,
    range: fullRange,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: args.data,
    },
  });

  return response.data;
}

export async function batchUpdateCells(
  args: z.infer<typeof batchUpdateCellsSchema>
): Promise<unknown> {
  const services = await getGoogleServices();

  const data = Object.entries(args.ranges).map(([rangeStr, values]) => ({
    range: `${args.sheet}!${rangeStr}`,
    values,
  }));

  const response = await services.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: args.spreadsheet_id,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });

  return response.data;
}

export async function addRows(
  args: z.infer<typeof addRowsSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const sheetId = await getSheetId(services, args.spreadsheet_id, args.sheet);

  if (sheetId === null) {
    return { error: `Sheet '${args.sheet}' not found` };
  }

  const startIndex = args.start_row ?? 0;
  const response = await services.sheets.spreadsheets.batchUpdate({
    spreadsheetId: args.spreadsheet_id,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex,
              endIndex: startIndex + args.count,
            },
            inheritFromBefore: startIndex > 0,
          },
        },
      ],
    },
  });

  return response.data;
}

export async function addColumns(
  args: z.infer<typeof addColumnsSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const sheetId = await getSheetId(services, args.spreadsheet_id, args.sheet);

  if (sheetId === null) {
    return { error: `Sheet '${args.sheet}' not found` };
  }

  const startIndex = args.start_column ?? 0;
  const response = await services.sheets.spreadsheets.batchUpdate({
    spreadsheetId: args.spreadsheet_id,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex,
              endIndex: startIndex + args.count,
            },
            inheritFromBefore: startIndex > 0,
          },
        },
      ],
    },
  });

  return response.data;
}

export async function listSheets(
  args: z.infer<typeof listSheetsSchema>
): Promise<string[]> {
  const services = await getGoogleServices();

  const response = await services.sheets.spreadsheets.get({
    spreadsheetId: args.spreadsheet_id,
  });

  return (
    response.data.sheets?.map((sheet) => sheet.properties?.title || "") || []
  );
}

export async function copySheet(
  args: z.infer<typeof copySheetSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const srcSheetId = await getSheetId(
    services,
    args.src_spreadsheet,
    args.src_sheet
  );

  if (srcSheetId === null) {
    return { error: `Source sheet '${args.src_sheet}' not found` };
  }

  const copyResponse = await services.sheets.spreadsheets.sheets.copyTo({
    spreadsheetId: args.src_spreadsheet,
    sheetId: srcSheetId,
    requestBody: {
      destinationSpreadsheetId: args.dst_spreadsheet,
    },
  });

  // Rename the copied sheet if needed
  if (copyResponse.data.title !== args.dst_sheet) {
    const renameResponse = await services.sheets.spreadsheets.batchUpdate({
      spreadsheetId: args.dst_spreadsheet,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: copyResponse.data.sheetId,
                title: args.dst_sheet,
              },
              fields: "title",
            },
          },
        ],
      },
    });

    return {
      copy: copyResponse.data,
      rename: renameResponse.data,
    };
  }

  return { copy: copyResponse.data };
}

export async function renameSheet(
  args: z.infer<typeof renameSheetSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const sheetId = await getSheetId(services, args.spreadsheet, args.sheet);

  if (sheetId === null) {
    return { error: `Sheet '${args.sheet}' not found` };
  }

  const response = await services.sheets.spreadsheets.batchUpdate({
    spreadsheetId: args.spreadsheet,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              title: args.new_name,
            },
            fields: "title",
          },
        },
      ],
    },
  });

  return response.data;
}

export async function getMultipleSheetData(
  args: z.infer<typeof getMultipleSheetDataSchema>
): Promise<unknown[]> {
  const services = await getGoogleServices();
  const results: unknown[] = [];

  for (const query of args.queries) {
    try {
      const fullRange = `${query.sheet}!${query.range}`;
      const response = await services.sheets.spreadsheets.values.get({
        spreadsheetId: query.spreadsheet_id,
        range: fullRange,
      });

      results.push({
        ...query,
        data: response.data.values || [],
      });
    } catch (error) {
      results.push({
        ...query,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

export async function getMultipleSpreadsheetSummary(
  args: z.infer<typeof getMultipleSpreadsheetSummarySchema>
): Promise<unknown[]> {
  const services = await getGoogleServices();
  const summaries: unknown[] = [];
  const rowsToFetch = args.rows_to_fetch ?? 5;

  for (const spreadsheetId of args.spreadsheet_ids) {
    const summaryData: {
      spreadsheet_id: string;
      title: string | null;
      sheets: unknown[];
      error: string | null;
    } = {
      spreadsheet_id: spreadsheetId,
      title: null,
      sheets: [],
      error: null,
    };

    try {
      const response = await services.sheets.spreadsheets.get({
        spreadsheetId,
        fields: "properties.title,sheets(properties(title,sheetId))",
      });

      summaryData.title = response.data.properties?.title || "Unknown Title";

      const sheetSummaries: unknown[] = [];
      for (const sheet of response.data.sheets || []) {
        const sheetTitle = sheet.properties?.title ?? undefined;
        const sheetId = sheet.properties?.sheetId ?? undefined;

        const sheetSummary: {
          title: string | undefined;
          sheet_id: number | undefined;
          headers: unknown[];
          first_rows: unknown[];
          error: string | null;
        } = {
          title: sheetTitle,
          sheet_id: sheetId,
          headers: [],
          first_rows: [],
          error: null,
        };

        if (!sheetTitle) {
          sheetSummary.error = "Sheet title not found";
          sheetSummaries.push(sheetSummary);
          continue;
        }

        try {
          const rangeToGet = `${sheetTitle}!A1:${Math.max(1, rowsToFetch)}`;
          const valuesResponse = await services.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: rangeToGet,
          });

          const values = valuesResponse.data.values || [];
          if (values.length > 0) {
            sheetSummary.headers = values[0];
            if (values.length > 1) {
              sheetSummary.first_rows = values.slice(1, rowsToFetch);
            }
          }
        } catch (sheetError) {
          sheetSummary.error = `Error fetching data: ${sheetError instanceof Error ? sheetError.message : String(sheetError)}`;
        }

        sheetSummaries.push(sheetSummary);
      }

      summaryData.sheets = sheetSummaries;
    } catch (error) {
      summaryData.error = `Error fetching spreadsheet: ${error instanceof Error ? error.message : String(error)}`;
    }

    summaries.push(summaryData);
  }

  return summaries;
}

export async function createSpreadsheet(
  args: z.infer<typeof createSpreadsheetSchema>
): Promise<unknown> {
  const services = await getGoogleServices();
  const targetFolderId = args.folder_id || services.folderId;

  interface FileMetadata {
    name: string;
    mimeType: string;
    parents?: string[];
  }

  const fileMetadata: FileMetadata = {
    name: args.title,
    mimeType: "application/vnd.google-apps.spreadsheet",
  };

  if (targetFolderId) {
    fileMetadata.parents = [targetFolderId];
  }

  const response = await services.drive.files.create({
    supportsAllDrives: true,
    requestBody: fileMetadata,
    fields: "id,name,parents",
  });

  return {
    spreadsheetId: response.data.id,
    title: response.data.name || args.title,
    folder: response.data.parents?.[0] || "root",
  };
}

export async function createSheet(
  args: z.infer<typeof createSheetSchema>
): Promise<unknown> {
  const services = await getGoogleServices();

  const response = await services.sheets.spreadsheets.batchUpdate({
    spreadsheetId: args.spreadsheet_id,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: args.title,
            },
          },
        },
      ],
    },
  });

  const newSheetProps = response.data.replies?.[0]?.addSheet?.properties;

  return {
    sheetId: newSheetProps?.sheetId,
    title: newSheetProps?.title,
    index: newSheetProps?.index,
    spreadsheetId: args.spreadsheet_id,
  };
}

export async function listSpreadsheets(
  args: z.infer<typeof listSpreadsheetsSchema>
): Promise<{ id: string; title: string }[]> {
  const services = await getGoogleServices();
  const targetFolderId = args.folder_id || services.folderId;

  let query = "mimeType='application/vnd.google-apps.spreadsheet'";
  if (targetFolderId) {
    query += ` and '${targetFolderId}' in parents`;
  }

  const response = await services.drive.files.list({
    q: query,
    spaces: "drive",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields: "files(id,name)",
    orderBy: "modifiedTime desc",
  });

  return (
    response.data.files?.map((file) => ({
      id: file.id || "",
      title: file.name || "",
    })) || []
  );
}

export async function shareSpreadsheet(
  args: z.infer<typeof shareSpreadsheetSchema>
): Promise<{ successes: unknown[]; failures: unknown[] }> {
  const services = await getGoogleServices();
  const successes: unknown[] = [];
  const failures: unknown[] = [];

  for (const recipient of args.recipients) {
    if (!recipient.email_address) {
      failures.push({
        email_address: null,
        error: "Missing email_address in recipient entry.",
      });
      continue;
    }

    if (!["reader", "commenter", "writer"].includes(recipient.role)) {
      failures.push({
        email_address: recipient.email_address,
        error: `Invalid role '${recipient.role}'. Must be 'reader', 'commenter', or 'writer'.`,
      });
      continue;
    }

    try {
      const response = await services.drive.permissions.create({
        fileId: args.spreadsheet_id,
        sendNotificationEmail: args.send_notification ?? true,
        requestBody: {
          type: "user",
          role: recipient.role,
          emailAddress: recipient.email_address,
        },
        fields: "id",
      });

      successes.push({
        email_address: recipient.email_address,
        role: recipient.role,
        permissionId: response.data.id,
      });
    } catch (error) {
      failures.push({
        email_address: recipient.email_address,
        error: `Failed to share: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return { successes, failures };
}

export async function listFolders(
  args: z.infer<typeof listFoldersSchema>
): Promise<{ id: string; name: string; parent: string }[]> {
  const services = await getGoogleServices();

  let query = "mimeType='application/vnd.google-apps.folder'";
  if (args.parent_folder_id) {
    query += ` and '${args.parent_folder_id}' in parents`;
  } else {
    query += " and 'root' in parents";
  }

  const response = await services.drive.files.list({
    q: query,
    spaces: "drive",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields: "files(id,name,parents)",
    orderBy: "name",
  });

  return (
    response.data.files?.map((folder) => ({
      id: folder.id || "",
      name: folder.name || "",
      parent: folder.parents?.[0] || "root",
    })) || []
  );
}

export async function batchUpdate(
  args: z.infer<typeof batchUpdateSchema>
): Promise<unknown> {
  const services = await getGoogleServices();

  if (!args.requests || args.requests.length === 0) {
    return { error: "requests list cannot be empty" };
  }

  const response = await services.sheets.spreadsheets.batchUpdate({
    spreadsheetId: args.spreadsheet_id,
    requestBody: {
      requests: args.requests as sheets_v4.Schema$Request[],
    },
  });

  return response.data;
}

// Import sheets_v4 for the type
import type { sheets_v4 } from "googleapis";

