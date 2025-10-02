const STORAGE_KEY = "datalogger_data";

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("addBtn").addEventListener("click", addManualData);
  document.getElementById("exportBtn").addEventListener("click", exportCsv);
  document.getElementById("clearBtn").addEventListener("click", clearData);
  startQrScanner();
});

function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveData(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  renderList(arr);
}

function addManualData() {
  const input = document.getElementById("manualInput");
  const value = input.value.trim();
  if (value) {
    const arr = getData();
    arr.push({ ts: Date.now(), type: "MANUAL", value });
    saveData(arr);
    input.value = "";
  }
}

function renderList(arr) {
  const list = document.getElementById("dataList");
  list.innerHTML = "";
  arr.forEach((item, idx) => {
    const li = document.createElement("li");
    const date = new Date(item.ts).toLocaleString();
    li.textContent = `${idx+1}. [${item.type}] ${item.value} (${date})`;
    list.appendChild(li);
  });
}

function loadData() { saveData(getData()); }

function clearData() {
  if (confirm("Biztos törölni akarod az összes adatot?")) {
    saveData([]);
  }
}

function exportCsv() {
  const arr = getData();
  if (arr.length === 0) return alert("Nincs exportálható adat");
  let csv = "id,timestamp,type,value\n";
  arr.forEach((item, i) => {
    csv += `${i+1},${item.ts},${item.type},"${item.value}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `datalog_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function startQrScanner() {
  const html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: 250 };
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    qrCodeMessage => {
      const arr = getData();
      arr.push({ ts: Date.now(), type: "QR", value: qrCodeMessage });
      saveData(arr);
    },
    errorMessage => {
      console.log("QR error", errorMessage);
    }
  ).catch(err => console.error("QR init error", err));
}