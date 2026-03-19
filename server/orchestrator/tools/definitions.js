export const AGENT_TOOLS = [
  {
    name: "classify_case",
    description: "Classify the incoming oncology case by type and clinical urgency tier. Analyze the case text carefully and think step by step before classifying. Extract any patient identifiers and clinical entities mentioned.",
    input_schema: {
      type: "object",
      properties: {
        case_type: {
          type: "string",
          enum: ["result_inquiry", "incomplete_order", "redraw_recommendation", "critical_value", "pa_status_check", "unstructured"],
          description: "The primary case type"
        },
        urgency_tier: {
          type: "string",
          enum: ["P0_critical", "P1_urgent", "P2_standard", "P3_routine"],
          description: "Clinical urgency tier. P0=life-safety/critical value. P1=therapy-blocking. P2=standard. P3=routine."
        },
        classification_confidence: { type: "number", minimum: 0, maximum: 1 },
        urgency_confidence: { type: "number", minimum: 0, maximum: 1 },
        rationale: { type: "string", description: "2-3 sentence plain-English classification rationale" },
        extracted_entities: {
          type: "object",
          properties: {
            cancer_type: { type: "string" },
            test_type: { type: "string" },
            physician_name: { type: "string" },
            patient_id: { type: "string" },
            order_id: { type: "string" }
          }
        }
      },
      required: ["case_type", "urgency_tier", "classification_confidence", "urgency_confidence", "rationale"]
    }
  },
  {
    name: "retrieve_patient_context",
    description: "Retrieve patient order history, test status, and prior case history from the data store. Use extracted patient_id and order_id from the classifier.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient ID in format P-XXXX" },
        order_id: { type: "string", description: "Order ID in format ORD-XXXXXX" },
        use_fuzzy_match: { type: "boolean", description: "Set true if exact IDs not available" }
      }
    }
  },
  {
    name: "apply_routing_rules",
    description: "Evaluate the case against the routing rules catalog. Determine which rules pass or fail based on the case type, urgency, and context.",
    input_schema: {
      type: "object",
      properties: {
        case_type: { type: "string" },
        urgency_tier: { type: "string" },
        missing_fields: { type: "array", items: { type: "string" }, description: "List missing order fields if incomplete_order type" },
        pa_days_pending: { type: "number", description: "Days since PA was submitted, if applicable" },
        has_critical_value: { type: "boolean" },
        has_actionable_mutation: { type: "boolean" }
      },
      required: ["case_type", "urgency_tier"]
    }
  },
  {
    name: "draft_response",
    description: "Generate a clinically accurate, empathetic response draft. CRITICAL: Only use information present in the retrieved context bundle. Never fabricate patient data.",
    input_schema: {
      type: "object",
      properties: {
        response_type: {
          type: "string",
          enum: ["result_inquiry", "redraw_recommendation", "pa_status", "critical_value", "order_confirmation", "order_incomplete"],
          description: "Type of response to generate"
        },
        recipient_type: {
          type: "string",
          enum: ["physician", "staff", "patient"],
          description: "Who this response is for — affects tone and terminology"
        },
        draft_text: { type: "string", description: "The complete draft response text" },
        clinical_accuracy_score: { type: "number", minimum: 0, maximum: 1, description: "Self-assessed confidence that draft is factually grounded in context" },
        accuracy_rationale: { type: "string", description: "Brief explanation of accuracy assessment" }
      },
      required: ["response_type", "recipient_type", "draft_text", "clinical_accuracy_score"]
    }
  },
  {
    name: "assign_to_queue",
    description: "Route the case to the correct operational queue based on all prior tool outputs. Apply all routing logic and safety rules.",
    input_schema: {
      type: "object",
      properties: {
        routing_queue: {
          type: "string",
          enum: ["auto_resolved", "order_management", "clinical_support", "pa_team", "critical_value_escalation", "unstructured_review"],
          description: "Target operational queue"
        },
        rep_type: {
          type: "string",
          enum: ["ops_specialist", "clinical_specialist", "pa_specialist", "senior_escalation"],
          description: "Recommended rep type"
        },
        auto_resolvable: { type: "boolean", description: "Whether this case can be resolved without human intervention" },
        routing_rationale: { type: "string", description: "2-3 sentence explanation of routing decision" },
        routing_confidence: { type: "number", minimum: 0, maximum: 1 }
      },
      required: ["routing_queue", "rep_type", "auto_resolvable", "routing_rationale", "routing_confidence"]
    }
  }
];
