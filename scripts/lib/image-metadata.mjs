// Add XMP without decoding or re-encoding the image payload.
const xml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const jpegXmp = Buffer.from('http://ns.adobe.com/xap/1.0/\0');
const pngXmp = 'XML:com.adobe.xmp';

export function createImageXmp(metadata) {
  const alt = (name, value) => `<${name}><rdf:Alt><rdf:li xml:lang="x-default">${xml(value)}</rdf:li></rdf:Alt></${name}>`;
  return `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:cc="http://creativecommons.org/ns#" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">${alt('dc:title', metadata.title)}${alt('dc:description', metadata.description)}<dc:creator><rdf:Seq><rdf:li>${xml(metadata.creator)}</rdf:li></rdf:Seq></dc:creator><dc:subject><rdf:Bag>${metadata.keywords.map(value => `<rdf:li>${xml(value)}</rdf:li>`).join('')}</rdf:Bag></dc:subject>${alt('dc:rights', metadata.rights)}<dc:source>${xml(metadata.source)}</dc:source><dc:format>${xml(metadata.format)}</dc:format><photoshop:Credit>${xml(metadata.credit)}</photoshop:Credit><xmpRights:Marked>True</xmpRights:Marked><xmpRights:WebStatement>${xml(metadata.licensePage)}</xmpRights:WebStatement><cc:license rdf:resource="${xml(metadata.license)}"/><xmp:MetadataDate>${xml(metadata.metadataDate)}</xmp:MetadataDate></rdf:Description></rdf:RDF></x:xmpmeta>`;
}

function jpegWithXmp(buffer, packet) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('Invalid JPEG signature.');
  const payload = Buffer.concat([jpegXmp, packet]);
  if (payload.length + 2 > 65535) throw new Error('JPEG XMP exceeds one APP1 segment.');
  const header = Buffer.alloc(4); header.writeUInt16BE(0xffe1); header.writeUInt16BE(payload.length + 2, 2);
  const parts = [buffer.subarray(0, 2), header, payload];
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) throw new Error('Invalid JPEG segment.');
    const start = offset;
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xda || marker === 0xd9) { parts.push(buffer.subarray(start)); return Buffer.concat(parts); }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { parts.push(buffer.subarray(start, offset)); continue; }
    const length = buffer.readUInt16BE(offset);
    const end = offset + length;
    if (length < 2 || end > buffer.length) throw new Error('Invalid JPEG segment length.');
    if (!(marker === 0xe1 && buffer.subarray(offset + 2, offset + 2 + jpegXmp.length).equals(jpegXmp))) parts.push(buffer.subarray(start, end));
    offset = end;
  }
  throw new Error('JPEG has no scan or end marker.');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, payload) {
  const chunk = Buffer.alloc(payload.length + 12);
  chunk.writeUInt32BE(payload.length); chunk.write(type, 4, 'ascii'); payload.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
  return chunk;
}
function pngWithXmp(buffer, packet) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('Invalid PNG signature.');
  const parts = [signature];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset), end = offset + length + 12;
    if (end > buffer.length) throw new Error('Invalid PNG chunk length.');
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, end - 4);
    if (!(type === 'iTXt' && data.subarray(0, data.indexOf(0)).toString() === pngXmp)) parts.push(buffer.subarray(offset, end));
    // Keep XMP in the header area so metadata-only readers need not decode IDAT.
    if (type === 'IHDR') parts.push(pngChunk('iTXt', Buffer.concat([Buffer.from(`${pngXmp}\0\0\0\0\0`), packet])));
    offset = end;
    if (type === 'IEND') {
      if (offset !== buffer.length) throw new Error('Unexpected data after PNG IEND.');
      return Buffer.concat(parts);
    }
  }
  throw new Error('PNG has no IEND chunk.');
}

function riffChunk(type, payload) {
  const chunk = Buffer.alloc(8 + payload.length + (payload.length % 2));
  chunk.write(type, 0, 'ascii'); chunk.writeUInt32LE(payload.length, 4); payload.copy(chunk, 8);
  return chunk;
}
function webpWithXmp(buffer, packet) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP' || buffer.readUInt32LE(4) + 8 !== buffer.length) throw new Error('Invalid WebP RIFF container.');
  const chunks = [];
  for (let offset = 12; offset < buffer.length;) {
    const length = buffer.readUInt32LE(offset + 4), end = offset + 8 + length + (length % 2);
    if (end > buffer.length) throw new Error('Invalid WebP chunk length.');
    chunks.push({type: buffer.toString('ascii', offset, offset + 4), data: buffer.subarray(offset + 8, offset + 8 + length), raw: buffer.subarray(offset, end)});
    offset = end;
  }
  let extended = chunks.find(chunk => chunk.type === 'VP8X');
  if (extended) {
    if (extended.data.length !== 10) throw new Error('Invalid WebP extended header.');
    const data = Buffer.from(extended.data); data[0] |= 0x04; extended.raw = riffChunk('VP8X', data);
  } else {
    const image = chunks.find(chunk => chunk.type === 'VP8 ' || chunk.type === 'VP8L');
    if (!image) throw new Error('WebP image dimensions are missing.');
    let width, height, alpha = chunks.some(chunk => chunk.type === 'ALPH');
    if (image.type === 'VP8 ') { width = image.data.readUInt16LE(6) & 0x3fff; height = image.data.readUInt16LE(8) & 0x3fff; }
    else { const bits = image.data.readUInt32LE(1); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; alpha ||= !!(bits & 0x10000000); }
    if (!width || !height) throw new Error('Invalid WebP image dimensions.');
    const data = Buffer.alloc(10); data[0] = 0x04 | (alpha ? 0x10 : 0) | (chunks.some(chunk => chunk.type === 'ICCP') ? 0x20 : 0) | (chunks.some(chunk => chunk.type === 'EXIF') ? 0x08 : 0);
    data.writeUIntLE(width - 1, 4, 3); data.writeUIntLE(height - 1, 7, 3);
    chunks.unshift({type: 'VP8X', raw: riffChunk('VP8X', data)});
  }
  const body = Buffer.concat([Buffer.from('WEBP'), ...chunks.filter(chunk => chunk.type !== 'XMP ').map(chunk => chunk.raw), riffChunk('XMP ', packet)]);
  const header = Buffer.alloc(8); header.write('RIFF'); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

export function embedImageXmp(buffer, metadata) {
  const packet = Buffer.from(createImageXmp(metadata));
  if (metadata.format === 'image/jpeg') return jpegWithXmp(buffer, packet);
  if (metadata.format === 'image/png') return pngWithXmp(buffer, packet);
  if (metadata.format === 'image/webp') return webpWithXmp(buffer, packet);
  throw new Error(`Unsupported raster metadata format: ${metadata.format}`);
}

export function embedSvgMetadata(svg, metadata, metadataId = 'dpp-publication-metadata') {
  if (!/^[a-z0-9-]+$/.test(metadataId)) throw new Error('Invalid SVG metadata ID.');
  // Keep all rendered elements and attributes intact; only descriptive nodes change.
  let output = svg.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/, `$1${xml(metadata.title)}$2`);
  // Retain the original extraction provenance, including its original source hash.
  output = output.replace(new RegExp(`<metadata id="${metadataId}">[\\s\\S]*?<\\/metadata>`), '');
  const block = `<metadata id="${metadataId}">${createImageXmp(metadata)}</metadata>`;
  output = output.replace(/(<desc\b[^>]*>[\s\S]*?<\/desc>)/, `$1${block}`);
  return output;
}
