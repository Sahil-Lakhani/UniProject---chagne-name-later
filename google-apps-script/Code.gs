// google-apps-script/Code.gs
// Deploy as: Web App → Execute as: Me → Access: Anyone
// Set Script Properties: QR_SECRET, SPREADSHEET_ID

var SHEET_NAME = 'testSheet';

// ---------------------------------------------------------------------------
// One-time setup — run this once manually from the Apps Script editor
// ---------------------------------------------------------------------------

function setupHeaders() {
  var ss = SpreadsheetApp.openById(getProperty('SPREADSHEET_ID'));
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found.');
  sheet.getRange(1, 14).setValue('conference_scanned');
  sheet.getRange(1, 15).setValue('conference_scanned_at');
  sheet.getRange(1, 16).setValue('workshop_scanned');
  sheet.getRange(1, 17).setValue('workshop_scanned_at');
  SpreadsheetApp.flush();
  Logger.log('Headers set for columns N, O, P, Q.');
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respond({ success: false, error: 'No POST body received.' });
    }

    var body = JSON.parse(e.postData.contents);

    if (!body || typeof body !== 'object') {
      return respond({ success: false, error: 'Request body must be a JSON object.' });
    }

    var token = body.token;
    var mode = body.mode;

    if (!token || !mode) {
      return respond({ success: false, error: 'Missing token or mode.' });
    }

    if (typeof token !== 'string' || typeof mode !== 'string') {
      return respond({ success: false, error: 'Invalid types received: token=' + typeof token + ', mode=' + typeof mode });
    }

    if (mode !== 'conference' && mode !== 'workshop') {
      return respond({ success: false, error: 'Invalid mode.' });
    }

    // Parse token: "ROW:17:abc123..."
    var parts = token.split(':');
    if (parts.length !== 3 || parts[0] !== 'ROW') {
      return respond({ success: false, error: 'Invalid QR code.' });
    }

    var rowNumber = parseInt(parts[1], 10);
    var providedMac = parts[2];

    if (isNaN(rowNumber) || rowNumber < 2) {
      return respond({ success: false, error: 'Invalid QR code.' });
    }

    if (!validateHmac(rowNumber, providedMac)) {
      return respond({ success: false, error: 'Invalid QR code.' });
    }

    var ss = SpreadsheetApp.openById(getProperty('SPREADSHEET_ID'));
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return respond({ success: false, error: 'Sheet "' + SHEET_NAME + '" not found. Available sheets: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', ') });
    }

    var result = markAttendee(sheet, rowNumber, mode);
    SpreadsheetApp.flush();
    return respond(result);

  } catch (err) {
    return respond({ success: false, error: err.message || 'Server error.' });
  }
}

// Needed so the browser fetch() can reach the endpoint without a preflight block
function doGet(e) {
  return respond({ status: 'ok' });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getProperty(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error('Script property "' + key + '" is not set.');
  return value;
}

function validateHmac(rowNumber, providedMac) {
  var secret = getProperty('QR_SECRET');
  var message = String(rowNumber);
  var macBytes = Utilities.computeHmacSha256Signature(message, secret);
  var hex = macBytes.map(function(b) {
    var h = (b & 0xFF).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
  return safeEqual(hex, providedMac);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getAttendee(sheet, rowNumber) {
  // Read C:Q (cols 3–17), 15 columns wide
  var row = sheet.getRange(rowNumber, 3, 1, 15).getValues()[0];
  // 0-based offsets within the C:Q slice:
  // C=0 (name), J=7 (workshopInterest),
  // N=11 (conferenceScanned), O=12 (conferenceScannedAt),
  // P=13 (workshopScanned), Q=14 (workshopScannedAt)
  return {
    name:                row[0]  || null,
    workshopInterest:    row[7]  || null,
    conferenceScanned:   row[11] === true || String(row[11]).toUpperCase() === 'TRUE',
    conferenceScannedAt: row[12] || null,
    workshopScanned:     row[13] === true || String(row[13]).toUpperCase() === 'TRUE',
    workshopScannedAt:   row[14] || null,
  };
}

function markAttendee(sheet, rowNumber, mode) {
  var attendee = getAttendee(sheet, rowNumber);
  var timestamp = new Date().toISOString();

  if (mode === 'conference') {
    if (attendee.conferenceScanned) {
      return { success: false, alreadyScanned: true, scannedAt: attendee.conferenceScannedAt };
    }
    sheet.getRange(rowNumber, 14).setValue(true);      // col N
    sheet.getRange(rowNumber, 15).setValue(timestamp); // col O
    return { success: true, name: attendee.name, workshopInterest: attendee.workshopInterest };
  }

  if (mode === 'workshop') {
    if (attendee.workshopScanned) {
      return { success: false, alreadyScanned: true, scannedAt: attendee.workshopScannedAt };
    }
    sheet.getRange(rowNumber, 16).setValue(true);      // col P
    sheet.getRange(rowNumber, 17).setValue(timestamp); // col Q
    var result = { success: true, name: attendee.name, workshopInterest: attendee.workshopInterest };
    if (attendee.workshopInterest === 'No') {
      result.warning = true;
    }
    return result;
  }

  return { success: false, error: 'Invalid mode "' + mode + '". Expected conference or workshop.' };
}
