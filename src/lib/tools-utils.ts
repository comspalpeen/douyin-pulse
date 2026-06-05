export function formatLocalInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatDisplayTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function splitKeywords(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\n;；]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export async function triggerBlobDownload(response: Response, defaultFilename: string) {
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let fileName = defaultFilename;
  if (disposition && disposition.indexOf('filename*=UTF-8\'\'') !== -1) {
    fileName = decodeURIComponent(disposition.split('filename*=UTF-8\'\'')[1]);
  } else if (disposition) {
    const match = disposition.match(/filename="(.+)"/);
    if (match) fileName = match[1];
  }
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}