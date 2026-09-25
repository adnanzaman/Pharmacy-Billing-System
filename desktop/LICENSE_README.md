# Xmart desktop licensing

The production Electron app is machine-bound using an Ed25519-signed license file.
The private signing key is intentionally **not** included in this source package.

## First activation

1. Install the desktop application on the customer's licensed computer.
2. If no valid license is present, the application shows the Xmart contact message and the computer's `Machine ID`.
3. On the Xmart licensing/admin computer, create a signed license:

```text
node tools/create-license.js --machine-hash <Machine-ID> --hospital "Hospital Name" --private-key <xmart-private.pem> --out license.json
```

4. Copy `license.json` into the application's user-data folder shown by the installer/app documentation. Do **not** give customers the private signing key.

The license contains the hospital name and machine fingerprint. Copying the application to another computer therefore fails signature/machine validation and displays:

**Please contact Xmart Solution LLC — 03328327729**

## Important security note

This is a licensing control, not an absolute anti-piracy guarantee. A determined attacker can reverse engineer desktop software. The strongest production setup is to keep the licensing authority on an Xmart-controlled server and periodically validate the installation in addition to this signed local license.
