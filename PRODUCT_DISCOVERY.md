# Oncology Case Triage Agent — Product Discovery Document

**Document Type:** Product Discovery  
**Version:** 1.0  
**Status:** Draft  
**Author:** Amit Sharma — Product Manager, Agentic AI  
**Date:** March 2026  
**Repo:** Oncology-Case-Triage  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Industry Context & Problem Landscape](#2-industry-context--problem-landscape)
3. [User Research & Personas](#3-user-research--personas)
4. [Current State Analysis (As-Is)](#4-current-state-analysis-as-is)
5. [Pain Point Prioritization](#5-pain-point-prioritization)
6. [Opportunity Areas](#6-opportunity-areas)
7. [Solution Vision](#7-solution-vision)
8. [Agent Architecture Overview](#8-agent-architecture-overview)
9. [Success Metrics & North Star](#9-success-metrics--north-star)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Roadmap Phasing](#11-roadmap-phasing)
12. [Open Questions & Next Steps](#12-open-questions--next-steps)

---

## 1. Executive Summary

Precision oncology testing — including liquid biopsy, MRD monitoring, and genomic profiling — is one of the highest-value, highest-urgency workflows in modern healthcare. Yet the operational infrastructure supporting it remains deeply manual, fragmented, and error-prone.

At Guardant Health and across the precision oncology industry, a case — whether it's a physician query about a result, an incomplete test order, an insurance prior authorization, or a critical value requiring urgent follow-up — passes through an average of 4–7 human touchpoints before resolution. Each handoff introduces latency. In oncology, latency costs lives.

This document defines the problem space, user needs, and product vision for the **Oncology Case Triage Agent**: an agentic AI platform that autonomously classifies, contextualizes, drafts, and routes oncology cases — reducing Mean Time to Clinical Action (MTTCA) by 60%+ while building a compounding observability foundation for continuous improvement.

**North Star Metric:** Mean Time to Clinical Action (MTTCA)  
**Target:** Reduce from industry average of ~4.2 hours → under 45 minutes for P1/P2 cases  

---

## 2. Industry Context & Problem Landscape

### 2.1 The Scale of the Problem

The U.S. cancer diagnostics market processes an estimated **19 million oncology-related lab orders per year**, growing at 7.4% CAGR as liquid biopsy and genomic profiling adoption accelerates. Despite this volume growth, operational infrastructure at most precision oncology labs has not scaled proportionally. The result is a growing operational debt that manifests as:

- **Order processing backlogs** averaging 48–72 hours at peak volume periods
- **Prior authorization cycle times** of 8–14 days, delaying treatment starts
- **Result inquiry resolution times** of 20–45 minutes per case, fully manual
- **Critical value notification gaps** — in regulated environments, missing a 24-hour acknowledgment SLA has compliance and liability consequences

### 2.2 Current Industry Problems (Research-Grounded)

#### Problem 1: The "Order Incompleteness" Tax

According to a 2024 analysis by the American Journal of Clinical Pathology, **27–34% of oncology lab orders arrive with at least one missing or ambiguous field** — diagnosis code, insurance information, specimen type, or physician NPI. Each incomplete order requires:

- A human ops rep to identify the gap (avg. 8 min)
- Outbound contact to the ordering physician's office (avg. 22 min wait)
- Re-entry and re-submission (avg. 10 min)

At scale, this means a lab processing 500 orders/day is spending **~83 FTE-hours per day** purely on order remediation — before a single test begins. This problem is structurally ignored because it's invisible: it doesn't show up on clinical outcomes dashboards, only on ops cost reports.

#### Problem 2: Result Communication Failures at the Last Mile

The ONC (Office of the National Coordinator for Health IT) flagged in its 2023 report that **54% of oncology test result communication failures** occur not in the lab, but in the handoff between the lab's reporting system and the ordering clinician's workflow. The failure modes include:

- Result delivered to an EHR inbox no one monitors
- Physician change (covering provider, transferred patient) not reflected in routing
- Critical genomic findings (e.g., BRCA1/2, MSI-H) sent via PDF to a fax number
- No acknowledgment loop — the lab cannot confirm the physician saw the result

For liquid biopsy specifically, where actionable mutations (e.g., EGFR exon 19 deletion, ALK rearrangement) directly determine first-line therapy selection, a 48-hour communication lag can mean a patient starts on the wrong treatment.

#### Problem 3: Prior Authorization — The Systemic Bottleneck

Prior authorization for molecular diagnostics is among the most complex in all of healthcare. Payer policies vary dramatically:

- Medicare covers Guardant360 CDx for NSCLC with specific ICD-10 requirements
- Commercial payers have 140+ distinct PA policy variants for liquid biopsy
- Medicaid coverage varies by state, sometimes requiring peer-to-peer review

A 2025 AMA survey found that **oncologists spend an average of 14.9 hours per week** on administrative tasks, with prior authorization being the single largest component. PA denial rates for liquid biopsy ran at **23% on first submission** in 2024, with re-submission success rates of 67% — meaning a significant volume of clinically appropriate tests are either delayed or abandoned.

The current workflow at most labs: a PA specialist manually checks each payer portal, drafts a letter of medical necessity (LMN), submits via fax or web form, and follows up manually every 3–5 days. This is entirely automatable for the majority of cases.

#### Problem 4: Batch Order Prioritization — No Clinical Intelligence

Community oncology clinics — a rapidly growing segment as oncology care shifts away from academic centers — often submit orders in batches. A single community clinic may send 8–20 orders at once, with no priority flagging. The processing queue is typically FIFO (first-in, first-out).

The clinical reality: not all orders are equal. A Stage IV NSCLC patient awaiting Guardant360 results to determine platinum-based vs. targeted therapy is clinically urgent in a way that a Stage I colorectal SHIELD screening order is not. Processing them in the same queue is a clinical prioritization failure masquerading as an ops efficiency problem.

No lab currently has a production system that applies clinical urgency scoring at intake. This is an uncontested opportunity.

#### Problem 5: The Compliance and Documentation Gap

Precision oncology labs operate under CAP (College of American Pathologists), CLIA, and in some cases FDA regulatory frameworks. Critical value notification — where a test result requires physician contact within a defined window (typically 24–60 hours) — is a compliance requirement.

The documentation of these notifications is currently manual in most labs: a rep calls, leaves a voicemail, logs it in a free-text field in the CRM. This creates:

- **Audit risk**: free-text logs are not structured, not searchable, not reportable
- **Re-contact gaps**: if the first contact attempt fails, there is no automatic escalation
- **Liability exposure**: in cases where delayed notification contributed to adverse outcomes, unstructured logs are indefensible

A 2024 CAP Q-Probes study found that **38% of labs had at least one critical value notification documentation deficiency** in the prior 12 months.

#### Problem 6: The Physician Experience Gap

Net Promoter Scores (NPS) for precision oncology labs, when measured at the physician practice level rather than the patient level, consistently hover in the 20–35 range — low for a B2B healthcare product. The #1 driver of detraction in qualitative research: **"I can't get a fast answer when I have a question about an order or result."**

Physician offices interact with labs through a patchwork of channels: phone, fax, email, portal, and occasionally EHR-integrated orders. Response times across these channels are inconsistent. The physician experience is shaped by the worst interaction, not the average. Labs that solve this problem build durable competitive moats — physicians route more volume to labs they trust.

### 2.3 Macro Tailwinds Accelerating the Opportunity

| Tailwind | Relevance |
|---|---|
| **FDA ctDNA approvals accelerating** | More approved indications = more volume = more operational pressure |
| **CMS reimbursement expansion for liquid biopsy** | Drives payer coverage standardization, making PA automation more tractable |
| **TEFCA interoperability mandates** | EHR data more accessible for agent context retrieval |
| **Oncologist shortage** | 2,200 oncologist shortage projected by 2030 (ASCO) — admin burden reduction is existential |
| **AI regulatory clarity** | FDA's 2024 AI/ML SaMD framework gives labs a path to deploy AI in regulated workflows |

---

## 3. User Research & Personas

### Persona 1: Dr. Priya Nair — Community Oncologist
**Location:** Suburban community oncology practice, Texas  
**Volume:** Orders 15–20 molecular tests per week  
**EHR:** Epic (limited lab integration)  

**Jobs to Be Done:**
- Get genomic results fast enough to make treatment decisions before the patient's next appointment
- Understand why a result was "insufficient" and what to do next
- Not spend time on hold with lab support

**Current Pain:**
> *"I ordered a liquid biopsy on Friday. My patient comes in Wednesday. I have no idea where the result is, and if I call the lab I'm on hold for 20 minutes. I end up delaying the treatment conversation by a full week."*

**What success looks like:** Proactive status updates pushed to her inbox. A clear re-draw recommendation within hours of an insufficient result, not days.

---

### Persona 2: Marcus Chen — Lab Operations Specialist
**Team:** Order Management, Guardant Health  
**Handles:** 80–100 cases/day across order intake, result inquiries, and PA follow-up  

**Jobs to Be Done:**
- Clear his queue efficiently without making errors
- Know which cases are urgent without manually reading each one
- Avoid re-work from misrouted cases

**Current Pain:**
> *"Half my day is copy-pasting information between systems. I'm looking at the order in one tab, the patient in Salesforce, and typing the same info into a third system to submit the PA. There's no reason a human should be doing this."*

**What success looks like:** His queue shows only cases that genuinely need human judgment. Routine cases are resolved before he sees them. He becomes a reviewer, not a processor.

---

### Persona 3: Sarah Okafor — Prior Authorization Specialist
**Team:** Revenue Cycle, Precision Oncology Lab  
**Handles:** PA submissions, denials, appeals for 60–80 cases/week  

**Jobs to Be Done:**
- Submit PAs that don't get denied on technicalities
- Track status across 20+ payer portals without losing anything
- Escalate denials with a strong appeal letter quickly

**Current Pain:**
> *"Every payer has a different portal, different forms, different clinical criteria. I have a spreadsheet to track where everything is. When I'm out sick, cases fall through the cracks."*

**What success looks like:** Automated PA submission for standard cases. A dashboard showing status across all payers. AI-drafted appeal letters that she reviews and approves.

---

### Persona 4: Jordan Kim — Oncology Account Executive
**Team:** Sales/Customer Success  
**Manages:** 40 physician accounts across a territory  

**Jobs to Be Done:**
- Know when a physician account has an unresolved issue before it becomes a complaint
- Have data to show physicians their turnaround time and quality metrics
- Get alerted when a high-value account's order is at risk

**Current Pain:**
> *"I find out about physician satisfaction problems in the quarterly business review. By then the relationship is already damaged. I need to know in real-time."*

**What success looks like:** A feed of account-level case health. Proactive alerts when SLA is at risk. Data to show physicians that the lab is performing.

---

## 4. Current State Analysis (As-Is)

### 4.1 Case Flow Swimlane (Current State)

```
PHYSICIAN OFFICE          LAB OPS (INTAKE)        CRM/SALESFORCE         ROUTING QUEUE
      |                         |                        |                     |
      | Submit order            |                        |                     |
      |------------------------>|                        |                     |
      |                         | Manual review          |                     |
      |                         | (8-15 min)             |                     |
      |                         |                        |                     |
      |   [IF INCOMPLETE]       |                        |                     |
      |<------------------------|                        |                     |
      | Callback / fax request  |                        |                     |
      |                         |                        |                     |
      | Provide missing info    |                        |                     |
      |------------------------>|                        |                     |
      |                         | Re-enter data          |                     |
      |                         | Manual classification  |                     |
      |                         |----------------------->|                     |
      |                         |                        | Create case         |
      |                         |                        | (manual fields)     |
      |                         |                        |-------------------->|
      |                         |                        |                     | Assign to rep
      |                         |                        |                     | (FIFO, no priority)
```

**Observed Inefficiencies:**
- Average 3.2 human touchpoints per case before routing
- No clinical urgency scoring at intake
- Salesforce case creation is manual (copy-paste from order PDF)
- Queue assignment is FIFO — no intelligence applied
- No automated acknowledgment to physician office after submission

### 4.2 Systems Landscape (Current)

| System | Role | Integration Gap |
|---|---|---|
| **Salesforce Health Cloud** | Case management, account data | Manual case creation; no automated field population |
| **LIS (Lab Information System)** | Order tracking, result status | No outbound webhooks; status requires manual lookup |
| **Payer Portals (140+)** | PA submission and status | No API; web scraping or manual portal login |
| **EHR (Epic, Cerner, etc.)** | Patient history, orders | Limited FHIR integration; mostly fax/HL7 |
| **Email/Phone/Fax** | Physician communication | Unstructured; no logging in CRM |

---

## 5. Pain Point Prioritization

Prioritized by **Severity × Frequency × Addressability with AI**:

| Pain Point | Severity (1-5) | Frequency | AI Addressability | Priority Score |
|---|---|---|---|---|
| Incomplete order remediation | 4 | Very High (34% of orders) | High | **🔴 P0** |
| Result inquiry manual lookup | 4 | High (daily) | High | **🔴 P0** |
| Clinical urgency not applied at intake | 5 | Universal | High | **🔴 P0** |
| PA tracking and follow-up | 3 | High | Medium | **🟡 P1** |
| Critical value notification compliance | 5 | Medium | High | **🟡 P1** |
| Physician experience / response time | 4 | High | High | **🟡 P1** |
| Batch order prioritization | 3 | Medium | High | **🟢 P2** |
| AE reporting and rep alerting | 2 | Low | Medium | **🟢 P2** |

---

## 6. Opportunity Areas

### Opportunity 1: Autonomous Order Completeness & Enrichment Agent
Auto-detect missing fields, infer likely values from patient history and clinical context, pre-populate and flag only genuinely ambiguous items for human review.

**Estimated impact:** 60% reduction in outbound calls for order remediation. 8 FTE-hours/day recaptured at a 500-order/day lab.

### Opportunity 2: Intelligent Case Classification & Priority Scoring
At case creation, apply a clinical urgency model: Stage IV > Stage III > Stage II > Stage I. Apply SLA tiers accordingly. Route to appropriate queue and rep automatically.

**Estimated impact:** 40% reduction in clinical urgency-related SLA breaches. Measurable improvement in physician NPS for urgent accounts.

### Opportunity 3: Result Inquiry Self-Service + Agent Escalation
First-line: agent retrieves result status, QC data, and re-draw eligibility and drafts a physician-appropriate response. Only escalates when clinical judgment is required.

**Estimated impact:** 70% of result inquiries handled without a human rep. 22 minutes → 3 minutes average resolution.

### Opportunity 4: PA Submission and Status Monitoring Agent
Auto-draft letters of medical necessity, submit to payer portals via RPA, monitor status, and draft appeal letters for denials. Human reviews before submission, not during research.

**Estimated impact:** PA cycle time from 12 days → 6 days. $2.1M+ annual revenue protection for a lab with 5,000 PA cases/month.

### Opportunity 5: Critical Value Compliance Automation
Detect critical results, initiate structured physician notification workflow, log all contact attempts in structured CRM fields, auto-escalate after SLA breach, generate compliance reports.

**Estimated impact:** Documentation deficiency rate from 38% → <5%. Audit-ready logging for 100% of critical value cases.

---

## 7. Solution Vision

### 7.1 The Oncology Case Triage Agent

A production-grade agentic AI platform that acts as the **intelligent operations layer** between case intake and human resolution. The agent is not a chatbot — it is a multi-step reasoning system that orchestrates tools, retrieves context, applies rules, and makes routing decisions autonomously for the majority of cases.

**Design Principles:**

1. **Human-in-the-loop by design, not by default** — the agent handles routine; humans handle ambiguous
2. **Every decision is traceable** — full audit log of tool calls, confidence scores, and reasoning
3. **Composable, not monolithic** — each agent capability (classifier, drafter, router) is independently deployable
4. **Empower user-builders** — ops specialists can configure routing rules and prompt templates without engineering
5. **HIPAA-first architecture** — PHI never leaves compliant infrastructure; PII is masked in logs

### 7.2 Core Agent Capabilities (MVP Scope)

| Capability | Description | Output |
|---|---|---|
| **Case Classifier** | Identifies case type, urgency tier, and required workflow | Classification + confidence score |
| **Context Retriever** | Pulls patient history, order status, prior cases from mock data store | Structured context bundle |
| **Rules Engine** | Applies eligibility, SLA, and routing rules | Pass/Fail flags + rule citations |
| **Response Drafter** | Generates physician-appropriate response draft | Draft + tone/clinical appropriateness score |
| **Router** | Assigns case to queue, rep type, and priority tier | Routing decision + rationale |
| **Observability Layer** | Logs all decisions with timestamps, confidence, and tool traces | Dashboard-ready event stream |

---

## 8. Agent Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CASE INTAKE                          │
│    (Simulated: form input / batch upload / API webhook)     │
└─────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT                        │
│   LLM with tool-calling (Claude claude-sonnet-4-20250514)              │
│   Decides: which tools to call, in what order, when to stop │
└───┬──────────┬──────────┬──────────┬────────────┬───────────┘
    │          │          │          │            │
    ▼          ▼          ▼          ▼            ▼
[CLASSIFY] [RETRIEVE] [RULES]  [DRAFT]      [ROUTE]
 Tool 1     Tool 2    Tool 3   Tool 4       Tool 5
    │          │          │          │            │
    └──────────┴──────────┴──────────┴────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  DECISION OUTPUT                            │
│   - Case classification + urgency tier                      │
│   - Routing queue + assigned rep type                       │
│   - Draft response for physician                            │
│   - Confidence scores per step                              │
│   - Full decision trace (audit log)                         │
└─────────────────────────┬───────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
            [AUTO-RESOLVE]  [HUMAN QUEUE]
            (high confidence)  (low confidence /
                               edge case)
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│               OBSERVABILITY DASHBOARD                       │
│   MTTCA | Auto-Resolution Rate | Triage Accuracy            │
│   Confidence Distribution | Latency per Step | SLA Breach % │
└─────────────────────────────────────────────────────────────┘
```

### 8.1 Tool Definitions (MVP)

```json
{
  "tools": [
    {
      "name": "classify_case",
      "description": "Classify incoming case by type, clinical urgency tier, and required workflow path",
      "parameters": {
        "case_text": "string",
        "case_source": "enum[phone, portal, fax, email, batch_upload]"
      }
    },
    {
      "name": "retrieve_patient_context",
      "description": "Retrieve patient order history, prior cases, and test status from mock data store",
      "parameters": {
        "patient_id": "string",
        "order_id": "string (optional)"
      }
    },
    {
      "name": "apply_routing_rules",
      "description": "Apply eligibility, SLA, and routing rules to determine if case can be auto-resolved",
      "parameters": {
        "case_type": "string",
        "urgency_tier": "enum[P0_critical, P1_urgent, P2_standard, P3_routine]",
        "missing_fields": "array[string]"
      }
    },
    {
      "name": "draft_response",
      "description": "Generate a clinically appropriate, empathetic response draft for the physician or patient",
      "parameters": {
        "case_context": "object",
        "response_type": "enum[result_inquiry, re_draw_recommendation, pa_status, critical_value, order_confirmation]",
        "recipient_type": "enum[physician, staff, patient]"
      }
    },
    {
      "name": "assign_to_queue",
      "description": "Route the case to the appropriate operational queue with priority and rep type",
      "parameters": {
        "case_classification": "object",
        "urgency_tier": "string",
        "auto_resolvable": "boolean"
      }
    }
  ]
}
```

---

## 9. Success Metrics & North Star

### 9.1 North Star Metric

**Mean Time to Clinical Action (MTTCA)**

Definition: Time from case entry into the system to a clinician or patient receiving a meaningful, actionable response or routing decision.

| Baseline (Current) | MVP Target (6 months) | Scale Target (12 months) |
|---|---|---|
| ~4.2 hours (P1 cases) | <45 minutes | <20 minutes |
| ~28 hours (P2 cases) | <4 hours | <90 minutes |

---

### 9.2 Operational Metrics

| Metric | Baseline | Target | Measurement Method |
|---|---|---|---|
| Auto-Resolution Rate | ~0% (fully manual) | 55% (MVP), 75% (scale) | Cases closed without human intervention / total cases |
| Triage Accuracy | N/A | >92% | Agent classification vs. human-audited ground truth |
| Escalation Rate | 100% | <35% | Cases requiring human touchpoint / total |
| SLA Breach Rate | ~22% | <5% | Cases exceeding SLA window / total |
| Re-work Rate | ~12% | <3% | Cases re-routed after initial assignment |
| Order Incompleteness Cycle Time | 48–72 hours | <4 hours | Time from incomplete detection to resolution |

### 9.3 AI Quality Metrics

| Metric | Target | Why It Matters |
|---|---|---|
| Confidence Score (avg per step) | >0.82 | Below 0.75 triggers human escalation |
| Tool Call Accuracy | >95% | Agent invokes the right tool in the right order |
| Draft Acceptance Rate | >70% | Human reps use AI draft as-is or minor edits |
| Hallucination Flag Rate | <0.5% | Agent cites non-existent data — critical in healthcare |
| Avg Latency per Case | <18 seconds | Full agent pipeline response time |

### 9.4 Business Impact Metrics

| Metric | Calculation Basis | Estimated Annual Value |
|---|---|---|
| FTE Hours Recaptured | 8 FTE-hrs/day × 250 working days | ~2,000 hours / $120K labor cost |
| Revenue Cycle (PA) | PA cycle time: 12 days → 6 days × avg test value $3,400 | $2.1M+ revenue acceleration |
| Physician NPS Improvement | +15 NPS points from top detractor driver removed | 8–12% volume retention improvement |
| Compliance Risk Reduction | Critical value doc deficiency: 38% → <5% | Audit risk reduction; liability avoidance |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **AI hallucination in clinical context** | Medium | Critical | Every agent output includes confidence score; <0.80 auto-escalates to human. No PHI used in prompt directly — always retrieved via structured tool call |
| **HIPAA / PHI exposure in logs** | Medium | Critical | PII masking in observability layer; logs store case IDs not patient names; SOC2 Type II architecture from day 1 |
| **Physician resistance to AI-drafted responses** | Medium | High | Transparent labeling ("AI-drafted, human-reviewed"); high draft acceptance rate builds trust iteratively |
| **Payer portal RPA fragility** | High | Medium | RPA targeted at stable portals only; human fallback for portals with high change rate; structured monitoring for breakage |
| **Low agent confidence on edge cases** | High | Low | Edge cases are expected and designed for — they go to human queue. The metric is whether the agent correctly *knows* it doesn't know |
| **Ops team adoption resistance** | Medium | Medium | User-builder program: ops SMEs configure templates and routing rules themselves, creating ownership not dependency |
| **Model drift / prompt regression** | Low | High | Champion/challenger A/B framework in place from MVP; automated regression tests on golden case set weekly |

---

## 11. Roadmap Phasing

### Phase 1 — MVP (0–3 months): Prove the Core Loop
**Scope:**
- Case intake via form (simulated)
- 5 case types: result inquiry, incomplete order, re-draw, critical value, PA status
- Full agent pipeline: classify → retrieve → rules → draft → route
- Decision trace UI with confidence scores
- 10 golden cases for eval

**Exit Criteria:** >90% triage accuracy on golden case set; full pipeline latency <20 seconds; decision trace exportable for audit.

---

### Phase 2 — Pilot (3–6 months): Real Data, Real Workflows
**Scope:**
- Salesforce Health Cloud integration (read case data, write back routing decision)
- LIS webhook integration (real-time order status)
- Batch order intake (CSV/API)
- Observability dashboard (MTTCA, auto-resolution rate, confidence distribution)
- User-builder console: ops SMEs configure routing rules and draft templates

**Exit Criteria:** MTTCA <45 min for P1 cases in pilot cohort; auto-resolution rate >40%; ops team NPS >50 for the tool.

---

### Phase 3 — Scale (6–12 months): Autonomous Operations
**Scope:**
- PA submission RPA (Power Automate / UiPath) for top 10 payers
- Critical value compliance module with structured logging
- A/B prompt framework (champion/challenger)
- Physician-facing status portal (proactive updates)
- MLOps pipeline: weekly prompt regression, model performance tracking

**Exit Criteria:** Auto-resolution rate >70%; MTTCA <20 min for P1; PA cycle time reduced by 50%.

---

## 12. Open Questions & Next Steps

### Open Questions
1. **Data access**: What PHI anonymization/tokenization approach is approved for agent context retrieval in the production environment?
2. **Confidence threshold calibration**: What is the acceptable false-negative rate for P0 (critical value) cases? This determines the escalation threshold.
3. **Physician communication channel**: Should AI-drafted responses be sent directly (with human review) or only surfaced to the rep as a draft? Regulatory and relationship implications differ.
4. **PA RPA scope**: Which payer portals have stable enough UI structure for RPA? What is the maintenance SLA commitment?
5. **EHR integration priority**: FHIR vs. HL7 v2 for order data — which ordering physician EHRs are highest priority?

### Immediate Next Steps
- [ ] **Week 1**: Build MVP prototype — agent pipeline with 5 tool calls, decision trace UI, 10 golden test cases
- [ ] **Week 2**: Instrument observability dashboard — MTTCA, auto-resolution rate, confidence distribution
- [ ] **Week 3**: Conduct discovery interviews with 3 ops specialists (Marcus persona) and 2 physician office managers (Dr. Nair persona)
- [ ] **Week 4**: Present discovery + MVP demo to stakeholders; align on pilot scope and Salesforce integration priority

---

## Appendix A: Reference Sources

| Source | Relevance |
|---|---|
| AJCP 2024: Incomplete Lab Order Analysis | Order incompleteness rate (27–34%) |
| ONC 2023 Health IT Report | Result communication failure rate (54%) |
| AMA 2025 Prior Authorization Survey | Physician admin burden (14.9 hrs/week) |
| ASCO 2024 Workforce Report | Oncologist shortage projection (2,200 by 2030) |
| CAP Q-Probes 2024 | Critical value documentation deficiency (38%) |
| FDA AI/ML SaMD Action Plan 2024 | Regulatory pathway for AI in regulated lab workflows |
| CMS MolDx Program 2024 | Liquid biopsy reimbursement expansion |

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **MTTCA** | Mean Time to Clinical Action — the north star metric |
| **LIS** | Laboratory Information System — tracks order and result status |
| **PA** | Prior Authorization — payer approval required before test reimbursement |
| **ctDNA** | Circulating Tumor DNA — the analyte in liquid biopsy |
| **MRD** | Minimal Residual Disease — post-treatment cancer monitoring |
| **CDx** | Companion Diagnostic — FDA-approved test paired with a specific therapy |
| **FHIR** | Fast Healthcare Interoperability Resources — modern health data standard |
| **RPA** | Robotic Process Automation — software bots for repetitive digital tasks |
| **LMN** | Letter of Medical Necessity — clinical justification document for PA submission |
| **CAP** | College of American Pathologists — laboratory accreditation body |
| **CLIA** | Clinical Laboratory Improvement Amendments — federal lab quality standards |
| **PHI** | Protected Health Information — HIPAA-regulated patient data |
| **SaMD** | Software as a Medical Device — FDA regulatory classification for clinical AI |

---

*Document maintained in: `github.com/sherpa18-glitch/Oncology-Case-Triage`*  
*Next review date: April 2026*
