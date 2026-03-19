export const PATIENTS = [
  {
    patient_id: "P-1001",
    name: "James Harrington",
    dob: "1958-04-12",
    cancer_type: "NSCLC",
    cancer_stage: "Stage IV",
    physician_name: "Dr. Priya Nair",
    physician_npi: "1234567890",
    insurance_id: "INS-AET-88821",
    payer_name: "Aetna",
    orders: [
      { order_id: "ORD-100101", test_type: "Guardant360 CDx", status: "resulted", submitted_at: "2026-03-10", resulted_at: "2026-03-17", icd10_code: "C34.12", specimen_type: "Blood", insurance_group: "GRP-44120", pa_status: "approved", pa_submitted_at: "2026-03-08" },
      { order_id: "ORD-100102", test_type: "Guardant360 CDx", status: "processing", submitted_at: "2026-03-01", resulted_at: null, icd10_code: "C34.12", specimen_type: "Blood", insurance_group: "GRP-44120", pa_status: "approved", pa_submitted_at: "2026-02-28" },
      { order_id: "ORD-100103", test_type: "Guardant Reveal", status: "resulted", submitted_at: "2026-01-15", resulted_at: "2026-01-22", icd10_code: "C34.12", specimen_type: "Blood", insurance_group: "GRP-44120", pa_status: "approved", pa_submitted_at: "2026-01-13" }
    ],
    prior_cases: [
      { case_type: "result_inquiry", summary: "Physician inquired about Guardant360 turnaround time", resolution: "Confirmed 7-day TAT; result delivered on time", created_at: "2026-01-18" },
      { case_type: "pa_status_check", summary: "PA status inquiry for Guardant Reveal", resolution: "PA approved by Aetna within 5 days", created_at: "2026-01-14" }
    ]
  },
  {
    patient_id: "P-1002",
    name: "Maria Santos",
    dob: "1965-08-22",
    cancer_type: "Colorectal",
    cancer_stage: "Stage II",
    physician_name: "Dr. Kevin Walsh",
    physician_npi: "2345678901",
    insurance_id: "INS-UHC-44422",
    payer_name: "UnitedHealth",
    orders: [
      { order_id: "ORD-100201", test_type: "SHIELD", status: "resulted", submitted_at: "2026-03-05", resulted_at: "2026-03-12", icd10_code: "Z12.11", specimen_type: "Blood", insurance_group: null, pa_status: "not_required", pa_submitted_at: null },
      { order_id: "ORD-100202", test_type: "SHIELD", status: "pending_ack", submitted_at: "2026-03-14", resulted_at: "2026-03-14", icd10_code: "Z12.11", specimen_type: "Blood", insurance_group: "GRP-88241", pa_status: "not_required", pa_submitted_at: null, critical: true }
    ],
    prior_cases: [
      { case_type: "result_inquiry", summary: "SHIELD positive result — physician acknowledgment requested", resolution: "Pending acknowledgment — 26 hours elapsed", created_at: "2026-03-15" }
    ]
  },
  {
    patient_id: "P-1003",
    name: "Robert Chen",
    dob: "1952-11-03",
    cancer_type: "Ovarian",
    cancer_stage: "Stage III",
    physician_name: "Dr. Priya Nair",
    physician_npi: "1234567890",
    insurance_id: "INS-BCBS-22190",
    payer_name: "BlueCross BlueShield",
    orders: [
      { order_id: "ORD-100301", test_type: "Guardant360 CDx", status: "insufficient", submitted_at: "2026-03-08", resulted_at: "2026-03-14", icd10_code: "C56.1", specimen_type: "Blood", insurance_group: "GRP-22190", pa_status: "approved", pa_submitted_at: "2026-03-06" }
    ],
    prior_cases: []
  },
  {
    patient_id: "P-1004",
    name: "Linda Park",
    dob: "1971-06-15",
    cancer_type: "Breast",
    cancer_stage: "Stage II",
    physician_name: "Dr. Ananya Krishnan",
    physician_npi: "3456789012",
    insurance_id: "INS-CIG-55310",
    payer_name: "Cigna",
    orders: [
      { order_id: "ORD-100401", test_type: "Guardant Reveal", status: "processing", submitted_at: "2026-03-06", resulted_at: null, icd10_code: null, specimen_type: "Blood", insurance_group: null, pa_status: "pending", pa_submitted_at: "2026-03-04" }
    ],
    prior_cases: [
      { case_type: "incomplete_order", summary: "Missing ICD-10 and insurance group number on Reveal order", resolution: "Pending physician callback", created_at: "2026-03-07" }
    ]
  },
  {
    patient_id: "P-1005",
    name: "Thomas Wright",
    dob: "1948-02-28",
    cancer_type: "Pancreatic",
    cancer_stage: "Stage IV",
    physician_name: "Dr. Marcus Rivera",
    physician_npi: "4567890123",
    insurance_id: "INS-MED-00011",
    payer_name: "Medicare",
    orders: [
      { order_id: "ORD-100501", test_type: "Guardant360 CDx", status: "received", submitted_at: "2026-03-17", resulted_at: null, icd10_code: "C25.0", specimen_type: null, insurance_group: "GRP-00011", pa_status: "not_required", pa_submitted_at: null }
    ],
    prior_cases: []
  },
  {
    patient_id: "P-1006",
    name: "Susan Fitzgerald",
    dob: "1963-09-17",
    cancer_type: "NSCLC",
    cancer_stage: "Stage IV",
    physician_name: "Dr. Priya Nair",
    physician_npi: "1234567890",
    insurance_id: "INS-AET-99130",
    payer_name: "Aetna",
    orders: [
      { order_id: "ORD-100601", test_type: "Guardant360 CDx", status: "resulted", submitted_at: "2026-03-05", resulted_at: "2026-03-11", icd10_code: "C34.11", specimen_type: "Blood", insurance_group: "GRP-99130", pa_status: "denied", pa_submitted_at: "2026-03-03", actionable_mutation: "EGFR exon 19 deletion", critical: true }
    ],
    prior_cases: [
      { case_type: "critical_value", summary: "EGFR exon 19 deletion detected — therapy selection pending", resolution: "Physician unreachable — senior escalation required", created_at: "2026-03-12" }
    ]
  },
  {
    patient_id: "P-1007",
    name: "Michael Torres",
    dob: "1955-07-04",
    cancer_type: "Colorectal",
    cancer_stage: "Stage I",
    physician_name: "Dr. Kevin Walsh",
    physician_npi: "2345678901",
    insurance_id: "INS-HUM-77420",
    payer_name: "Humana",
    orders: [
      { order_id: "ORD-100701", test_type: "SHIELD", status: "received", submitted_at: "2026-03-18", resulted_at: null, icd10_code: "Z12.11", specimen_type: "Blood", insurance_group: "GRP-77420", pa_status: "not_required", pa_submitted_at: null }
    ],
    prior_cases: []
  },
  {
    patient_id: "P-1008",
    name: "Patricia Nguyen",
    dob: "1969-12-01",
    cancer_type: "Lung",
    cancer_stage: "Stage III",
    physician_name: "Dr. Ananya Krishnan",
    physician_npi: "3456789012",
    insurance_id: "INS-UHC-33810",
    payer_name: "UnitedHealth",
    orders: [
      { order_id: "ORD-100801", test_type: "Guardant Reveal", status: "processing", submitted_at: "2026-03-01", resulted_at: null, icd10_code: "C34.10", specimen_type: "Blood", insurance_group: "GRP-33810", pa_status: "pending", pa_submitted_at: "2026-03-01" }
    ],
    prior_cases: [
      { case_type: "pa_status_check", summary: "Guardant Reveal PA pending with UnitedHealth for 17 days", resolution: "Appeal in progress", created_at: "2026-03-10" }
    ]
  },
  {
    patient_id: "P-1009",
    name: "David Kim",
    dob: "1974-03-22",
    cancer_type: "Prostate",
    cancer_stage: "Stage II",
    physician_name: "Dr. Marcus Rivera",
    physician_npi: "4567890123",
    insurance_id: "INS-BCBS-41220",
    payer_name: "BlueCross BlueShield",
    orders: [
      { order_id: "ORD-100901", test_type: "Guardant Reveal", status: "resulted", submitted_at: "2026-02-20", resulted_at: "2026-02-27", icd10_code: "C61", specimen_type: "Blood", insurance_group: "GRP-41220", pa_status: "approved", pa_submitted_at: "2026-02-18" }
    ],
    prior_cases: []
  },
  {
    patient_id: "P-1010",
    name: "Helen Martinez",
    dob: "1961-05-30",
    cancer_type: "Colorectal",
    cancer_stage: "Stage III",
    physician_name: "Dr. Kevin Walsh",
    physician_npi: "2345678901",
    insurance_id: "INS-AET-12890",
    payer_name: "Aetna",
    orders: [
      { order_id: "ORD-101001", test_type: "SHIELD", status: "resulted", submitted_at: "2026-03-10", resulted_at: "2026-03-17", icd10_code: "Z12.11", specimen_type: "Blood", insurance_group: "GRP-12890", pa_status: "not_required", pa_submitted_at: null },
      { order_id: "ORD-101002", test_type: "Guardant360 CDx", status: "processing", submitted_at: "2026-03-15", resulted_at: null, icd10_code: "C18.4", specimen_type: "Blood", insurance_group: "GRP-12890", pa_status: "approved", pa_submitted_at: "2026-03-13" }
    ],
    prior_cases: []
  }
];

export const GOLDEN_CASES = [
  {
    id: "GC-01",
    label: "Stage IV NSCLC Result Inquiry",
    case_text: "Dr. Nair's office calling. We ordered a Guardant360 CDx for James Harrington, patient ID P-1001, about 8 days ago and still haven't received the result. He's Stage IV NSCLC and we need this for his treatment plan before his appointment on Friday. Order ID ORD-100102. This is urgent.",
    case_source: "phone",
    patient_id: "P-1001",
    order_id: "ORD-100102",
    expected: { case_type: "result_inquiry", urgency_tier: "P1_urgent", routing_queue: "clinical_support" }
  },
  {
    id: "GC-02",
    label: "Incomplete Order — Missing Fields",
    case_text: "Order submitted for Linda Park, patient P-1004, for Guardant Reveal MRD monitoring. We noticed the order ORD-100401 is missing the ICD-10 diagnosis code and the insurance group number is blank. Need to reach out to Dr. Krishnan's office to get these filled in.",
    case_source: "portal",
    patient_id: "P-1004",
    order_id: "ORD-100401",
    expected: { case_type: "incomplete_order", urgency_tier: "P2_standard", routing_queue: "order_management" }
  },
  {
    id: "GC-03",
    label: "SHIELD Critical Value — No Ack",
    case_text: "URGENT: SHIELD colorectal screening test returned a high-signal positive result for Maria Santos, patient P-1002, order ORD-100202. Result was delivered 26 hours ago and Dr. Walsh's office has not acknowledged receipt. This is past our 24-hour critical value notification window.",
    case_source: "portal",
    patient_id: "P-1002",
    order_id: "ORD-100202",
    expected: { case_type: "critical_value", urgency_tier: "P0_critical", routing_queue: "critical_value_escalation" }
  },
  {
    id: "GC-04",
    label: "PA Status Check — Stale",
    case_text: "Following up on prior authorization for James Harrington, P-1001, Guardant360 CDx. PA was submitted to Aetna over 11 days ago and we have not received any update. This is order ORD-100101. Need a status update urgently.",
    case_source: "phone",
    patient_id: "P-1001",
    order_id: "ORD-100101",
    expected: { case_type: "pa_status_check", urgency_tier: "P2_standard", routing_queue: "pa_team" }
  },
  {
    id: "GC-05",
    label: "Insufficient Result — Redraw",
    case_text: "Dr. Nair called about Robert Chen, P-1003, Stage III ovarian cancer. His Guardant360 CDx came back as insufficient tumor fraction on order ORD-100301. She wants to know if he's eligible for a redraw and what the timeline would be. She needs this result to make a treatment decision.",
    case_source: "phone",
    patient_id: "P-1003",
    order_id: "ORD-100301",
    expected: { case_type: "redraw_recommendation", urgency_tier: "P1_urgent", routing_queue: "clinical_support" }
  },
  {
    id: "GC-06",
    label: "Routine Order Confirmation",
    case_text: "This is Valley Community Oncology calling to confirm that the SHIELD screening order placed 2 hours ago for Michael Torres, P-1007, order ORD-100701, was successfully received by the lab. Just a routine check.",
    case_source: "phone",
    patient_id: "P-1007",
    order_id: "ORD-100701",
    expected: { case_type: "result_inquiry", urgency_tier: "P3_routine", routing_queue: "auto_resolved" }
  },
  {
    id: "GC-07",
    label: "Urgent Incomplete — Stage IV Pancreatic",
    case_text: "We submitted an urgent order for Thomas Wright, P-1005, Stage IV pancreatic cancer — order ORD-100501. The order is missing the specimen type and we cannot process without it. Dr. Rivera needs this Guardant360 result ASAP for treatment planning. Can someone call the office immediately?",
    case_source: "portal",
    patient_id: "P-1005",
    order_id: "ORD-100501",
    expected: { case_type: "incomplete_order", urgency_tier: "P1_urgent", routing_queue: "order_management" }
  },
  {
    id: "GC-08",
    label: "Critical EGFR Mutation — Physician Unreachable",
    case_text: "CRITICAL: Guardant360 CDx result for Susan Fitzgerald, P-1006, Stage IV NSCLC, order ORD-100601 shows EGFR exon 19 deletion — this is actionable for first-line targeted therapy. The result was delivered 30 hours ago. Dr. Nair's office is not responding to calls or portal messages. First-line treatment selection is being delayed.",
    case_source: "portal",
    patient_id: "P-1006",
    order_id: "ORD-100601",
    expected: { case_type: "critical_value", urgency_tier: "P0_critical", routing_queue: "critical_value_escalation" }
  },
  {
    id: "GC-09",
    label: "PA Denial — Appeal Needed",
    case_text: "Patricia Nguyen, P-1008, Guardant Reveal order ORD-100801. UnitedHealth denied the prior authorization. The denial reason is that they require additional clinical documentation showing prior treatment failure. Dr. Krishnan is requesting we file an appeal with a letter of medical necessity.",
    case_source: "email",
    patient_id: "P-1008",
    order_id: "ORD-100801",
    expected: { case_type: "pa_status_check", urgency_tier: "P2_standard", routing_queue: "pa_team" }
  },
  {
    id: "GC-10",
    label: "Batch Result Inquiry — 3 Patients",
    case_text: "Sunrise Community Oncology here. We have three patients whose SHIELD colorectal screening results are all past the 10-day turnaround window. Patients are Helen Martinez P-1010 (ORD-101002), Michael Torres P-1007, and a third patient from our clinic. All were submitted about 12 days ago. Can you check the status on all three?",
    case_source: "phone",
    patient_id: "P-1010",
    order_id: "ORD-101002",
    expected: { case_type: "result_inquiry", urgency_tier: "P2_standard", routing_queue: "clinical_support" }
  }
];
