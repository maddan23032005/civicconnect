export const FEE_CATALOGUE = [
  { code: "income_certificate",    label: "Income Certificate",        amountPaise: 6000 },
  { code: "community_certificate", label: "Community Certificate",     amountPaise: 6000 },
  { code: "nativity_certificate",  label: "Nativity Certificate",      amountPaise: 6000 },
  { code: "birth_certificate",     label: "Birth Certificate",         amountPaise: 5000 },
  { code: "patta_transfer",        label: "Patta Transfer",            amountPaise: 16000 },
  { code: "encumbrance",           label: "Encumbrance Certificate",   amountPaise: 10000 },
  { code: "land_tax",              label: "Land Tax Payment",          amountPaise: 25000 },
  { code: "property_tax",          label: "Property Tax",              amountPaise: 45000 },
  { code: "trade_licence",         label: "Trade Licence Renewal",     amountPaise: 120000 },
  { code: "water_connection",      label: "New Water Connection",      amountPaise: 85000 },
];

export function feeFor(code) {
  return FEE_CATALOGUE.find((f) => f.code === code) || null;
}

export function rupees(paise) {
  return (paise / 100).toFixed(2);
}

/** Records a state transition. Must run inside the same transaction as the update. */
export async function recordLedger(client, { paymentId, event, fromStatus, toStatus, detail = {} }) {
  await client.query(
    `INSERT INTO payment_ledger (payment_id, event, from_status, to_status, detail)
     VALUES ($1, $2, $3, $4, $5)`,
    [paymentId, event, fromStatus, toStatus, JSON.stringify(detail)]
  );
}
