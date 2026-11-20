const qrType = document.getElementById("qrType");
const urlFields = document.getElementById("urlFields");
const textFields = document.getElementById("textFields");
const wifiFields = document.getElementById("wifiFields");
const preview = document.getElementById("qrPreview");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const errorMessage = document.getElementById("errorMessage");
const logoInput = document.getElementById("logoInput");

let qrCode = null;
let logoData = "";

function showFields() {
  urlFields.hidden = qrType.value !== "url";
  textFields.hidden = qrType.value !== "text";
  wifiFields.hidden = qrType.value !== "wifi";
  errorMessage.textContent = "";
}
qrType.addEventListener("change", showFields);

function escapeWifi(value) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function getPayload() {
  if (qrType.value === "url") {
    const raw = document.getElementById("urlInput").value.trim();
    if (!raw) throw new Error("Please enter a website address.");
    let parsed;
    try { parsed = new URL(raw); } catch { throw new Error("Enter a valid URL, including https://."); }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only http:// and https:// website links are supported.");
    }
    return raw;
  }

  if (qrType.value === "text") {
    const value = document.getElementById("textInput").value.trim();
    if (!value) throw new Error("Please enter some text.");
    return value;
  }

  const ssid = document.getElementById("wifiName").value;
  const password = document.getElementById("wifiPassword").value;
  const security = document.getElementById("wifiSecurity").value;
  if (!ssid.trim()) throw new Error("Please enter the WiFi network name.");
  if (security !== "nopass" && !password) throw new Error("Please enter the WiFi password.");
  return `WIFI:T:${security};S:${escapeWifi(ssid)};${security === "nopass" ? "" : `P:${escapeWifi(password)};`}H:false;;`;
}

logoInput.addEventListener("change", () => {
  const file = logoInput.files[0];
  logoData = "";
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    errorMessage.textContent = "Please choose a PNG, JPG or WebP image.";
    logoInput.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.textContent = "Please use a logo smaller than 2 MB.";
    logoInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => { logoData = reader.result; };
  reader.onerror = () => { errorMessage.textContent = "Could not read that image. Try another file."; };
  reader.readAsDataURL(file);
});

generateBtn.addEventListener("click", () => {
  errorMessage.textContent = "";
  try {
    if (typeof QRCodeStyling === "undefined") {
      throw new Error("The QR library did not load. Check your internet connection and refresh.");
    }
    const payload = getPayload();
    const color = document.getElementById("qrColor").value;
    const background = document.getElementById("bgColor").value;
    qrCode = new QRCodeStyling({
      width: 280,
      height: 280,
      type: "canvas",
      data: payload,
      image: logoData || undefined,
      margin: 12,
      qrOptions: { errorCorrectionLevel: logoData ? "H" : "Q" },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.22, margin: 5, crossOrigin: "anonymous" },
      dotsOptions: { color, type: "rounded" },
      cornersSquareOptions: { color, type: "extra-rounded" },
      cornersDotOptions: { color, type: "dot" },
      backgroundOptions: { color: background }
    });
    preview.innerHTML = "";
    qrCode.append(preview);
    downloadBtn.disabled = false;
  } catch (error) {
    errorMessage.textContent = error.message || "Something went wrong. Please try again.";
    downloadBtn.disabled = true;
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!qrCode) return;
  try {
    await qrCode.download({ name: "qrify-code", extension: "png" });
  } catch {
    errorMessage.textContent = "The PNG could not be downloaded. Please try again.";
  }
});

resetBtn.addEventListener("click", () => {
  document.getElementById("urlInput").value = "";
  document.getElementById("textInput").value = "";
  document.getElementById("wifiName").value = "";
  document.getElementById("wifiPassword").value = "";
  document.getElementById("wifiSecurity").value = "WPA";
  document.getElementById("qrColor").value = "#071426";
  document.getElementById("bgColor").value = "#ffffff";
  logoInput.value = "";
  logoData = "";
  qrCode = null;
  preview.innerHTML = '<div class="preview-placeholder"><span>▦</span><p>Your QR code will appear here</p></div>';
  downloadBtn.disabled = true;
  errorMessage.textContent = "";
  qrType.value = "url";
  showFields();
});
showFields();
