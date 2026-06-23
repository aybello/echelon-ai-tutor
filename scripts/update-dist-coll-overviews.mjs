/**
 * update-dist-coll-overviews.mjs
 *
 * Replaces the old study-guide sub-module overviews for Ontario water distribution
 * and wastewater collection banks with content aligned to the official exam modules.
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

// ─── WATER DISTRIBUTION OVERVIEWS ────────────────────────────────────────────

const WD_OVERVIEWS_CLASS1 = {
  "General": {
    title: "General",
    intro: "The General module covers the foundational knowledge every Class 1 Water Distribution operator must have. This includes basic and applied math (calculating volumes, flow rates, chemical doses), units of expression, applied science (chemistry, microbiology, public health principles), electrical concepts, hydraulic concepts (head, pressure, flow), maps and plans, and safety procedures including WHMIS and first aid. On the Class 1 exam, this module accounts for 27 of the 80 questions.",
    keyTopics: ["Basic & Applied Math", "Units of Expression", "Applied Science & Public Health", "Electrical Concepts", "Hydraulic Concepts", "Maps & Plans", "Safety Procedures & WHMIS"]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "The Support Systems module covers the equipment and materials used to distribute safe drinking water. Class 1 operators must understand the basic operation and troubleshooting of electrical controls, motors, pumps (centrifugal, positive displacement, turbine, and metering), generators, engines, pipes, joints, valves, fittings, cathodic protection devices, hydrants, measuring and control systems, and cross-connection and backflow prevention devices. This module accounts for 16 of the 80 questions on the Class 1 exam.",
    keyTopics: ["Electrical Controls & Transformers", "Motors & Drives", "Pumps (Centrifugal, PD, Turbine, Metering)", "Generators & Engines", "Pipes, Joints & Fittings", "Valves & Hydrants", "Measuring & Control Systems", "Cross-Connection & Backflow Prevention"]
  },
  "Processes": {
    title: "Processes",
    intro: "The Processes module is the main focus of the Water Distribution exam. It covers the day-to-day operation of a distribution system including: sources and characteristics of water, quality control and assurance, regulatory compliance, conveyance, pressure control, storage (reservoirs, elevated tanks, standpipes), corrosion control, metering, leak detection, excavation and repair, temporary service, fire flow requirements, swabbing, flushing systems, chlorination of pipe repairs, thawing frozen mains, sampling, and testing (chlorine residual, pH, temperature). This module accounts for 34 of the 80 questions on the Class 1 exam.",
    keyTopics: ["Sources & Water Characteristics", "Quality Control & Assurance", "Regulatory Compliance (O. Reg. 170/03)", "Conveyance & Pressure Control", "Storage Systems", "Corrosion Control", "Metering & Leak Detection", "Pipe Repair & Rehabilitation", "Flushing & Disinfection of Mains", "Sampling & Testing"]
  },
  "Administration": {
    title: "Administration",
    intro: "The Administration module covers the administrative functions that support system operation. For Class 1, this includes basic record keeping, regulatory reporting, communication, and emergency response awareness. This module accounts for 3 of the 80 questions on the Class 1 exam.",
    keyTopics: ["Record Keeping & Documentation", "Regulatory Reporting", "Emergency Response Basics", "Communication"]
  }
};

const WD_OVERVIEWS_CLASS2 = {
  "General": {
    title: "General",
    intro: "At Class 2, the General module builds on Class 1 foundations with more advanced math (pump calculations, chemical feed rates), deeper applied science, intermediate electrical and hydraulic concepts, and more complex safety requirements. This module accounts for 21 of the 80 questions on the Class 2 exam.",
    keyTopics: ["Intermediate Math & Calculations", "Units of Expression", "Applied Science & Chemistry", "Electrical Concepts", "Hydraulic Concepts (Head Loss, Pump Curves)", "Safety & WHMIS"]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "At Class 2, operators must have intermediate knowledge of all support system equipment. This includes advanced pump selection and troubleshooting, motor controls and variable frequency drives, pipe materials and joining methods, valve types and operation, and backflow prevention programs. This module accounts for 10 of the 80 questions on the Class 2 exam.",
    keyTopics: ["Advanced Pump Operation & Troubleshooting", "Motor Controls & VFDs", "Pipe Materials & Joining", "Valve Types & Operation", "Backflow Prevention Programs"]
  },
  "Processes": {
    title: "Processes",
    intro: "The Processes module at Class 2 requires advanced knowledge of distribution system operations including hydraulic modeling basics, pressure zone management, water quality management throughout the distribution system, disinfection residual maintenance, cross-connection control programs, and comprehensive sampling and testing programs. This module accounts for 44 of the 80 questions on the Class 2 exam.",
    keyTopics: ["Hydraulic Modeling Basics", "Pressure Zone Management", "Water Quality in Distribution", "Disinfection Residual Maintenance", "Cross-Connection Control Programs", "Comprehensive Sampling Programs", "Corrosion Control Programs"]
  },
  "Administration": {
    title: "Administration",
    intro: "At Class 2, the Administration module expands to include management responsibilities, financial awareness, supervision basics, and more detailed regulatory reporting requirements. This module accounts for 5 of the 80 questions on the Class 2 exam.",
    keyTopics: ["Supervision & Management Basics", "Financial Awareness", "Regulatory Reporting (O. Reg. 170/03)", "Emergency Response Planning", "Record Keeping Systems"]
  }
};

const WD_OVERVIEWS_CLASS3 = {
  "General": {
    title: "General",
    intro: "At Class 3, the General module requires advanced knowledge of hydraulics, complex calculations, and advanced electrical systems. The emphasis shifts from basic knowledge to application and problem-solving. This module accounts for 13 of the 80 questions on the Class 3 exam.",
    keyTopics: ["Advanced Hydraulic Calculations", "Complex Math & Problem Solving", "Advanced Electrical Systems", "Applied Science Applications"]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "Class 3 operators must have advanced knowledge of all support systems, including the ability to evaluate equipment performance, specify replacement equipment, and manage maintenance programs. This module accounts for 9 of the 80 questions on the Class 3 exam.",
    keyTopics: ["Equipment Performance Evaluation", "Pump System Analysis", "Electrical System Management", "Maintenance Program Management", "SCADA & Instrumentation"]
  },
  "Processes": {
    title: "Processes",
    intro: "At Class 3, the Processes module requires advanced knowledge of distribution system management including hydraulic modeling, water quality management programs, asset management basics, and advanced troubleshooting. This module accounts for 49 of the 80 questions on the Class 3 exam.",
    keyTopics: ["Advanced Hydraulic Modeling", "Water Quality Management Programs", "Asset Management Basics", "Advanced Troubleshooting", "Pressure Management Programs", "Water Loss Management"]
  },
  "Administration": {
    title: "Administration",
    intro: "At Class 3, the Administration module covers management, supervision, financial management, regulatory compliance programs, and emergency management planning. This module accounts for 9 of the 80 questions on the Class 3 exam.",
    keyTopics: ["Staff Management & Supervision", "Financial Management", "Regulatory Compliance Programs", "Emergency Management Planning", "Public Communication"]
  }
};

const WD_OVERVIEWS_CLASS4 = {
  "General": {
    title: "General",
    intro: "At Class 4, the General module focuses on advanced applications of hydraulics, complex system analysis, and leadership in technical areas. Class 4 exams do not include basic math questions. This module accounts for 13 of the 80 questions on the Class 4 exam.",
    keyTopics: ["Advanced Hydraulic Analysis", "Complex System Calculations", "Advanced Electrical Applications", "Technical Leadership"]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "Class 4 operators must be able to evaluate, specify, and oversee all support systems at an advanced level, including capital planning for infrastructure replacement and advanced SCADA systems. This module accounts for 8 of the 80 questions on the Class 4 exam.",
    keyTopics: ["Capital Planning for Infrastructure", "Advanced SCADA & Automation", "Equipment Lifecycle Management", "System-Wide Equipment Evaluation"]
  },
  "Processes": {
    title: "Processes",
    intro: "At Class 4, the Processes module requires mastery of all distribution system processes including advanced hydraulic modeling, system-wide water quality management, risk-based asset management, and strategic planning. This module accounts for 49 of the 80 questions on the Class 4 exam.",
    keyTopics: ["Advanced Hydraulic Modeling (EPANET)", "System-Wide Water Quality Management", "Risk-Based Asset Management", "Strategic Infrastructure Planning", "Water Loss Control Programs", "DWQMS Implementation"]
  },
  "Administration": {
    title: "Administration",
    intro: "At Class 4, the Administration module covers senior management responsibilities including organizational management, strategic planning, financial management, regulatory leadership, and emergency management. This module accounts for 10 of the 80 questions on the Class 4 exam.",
    keyTopics: ["Organizational Management", "Strategic Planning", "Financial Management & Budgeting", "Regulatory Leadership & DWQMS", "Emergency Management Programs", "Stakeholder Communication"]
  }
};

// ─── WASTEWATER COLLECTION OVERVIEWS ─────────────────────────────────────────

const WWC_OVERVIEWS_CLASS1 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "This module covers the operation of all equipment found in a wastewater collection system. Class 1 operators must be able to operate pumps and motors, flow monitoring equipment, safety equipment, and basic SCADA controls. Understanding normal operating ranges and recognizing abnormal conditions is essential. This module accounts for 15% of the Class 1 exam.",
    keyTopics: ["Pump & Motor Operation", "Flow Monitoring Equipment", "Safety Equipment Operation", "Basic Controls & Instrumentation", "Normal vs. Abnormal Operating Conditions"]
  },
  "Evaluate & Maintain Equipment": {
    title: "Evaluate & Maintain Equipment",
    intro: "Class 1 operators must understand how to evaluate equipment condition and perform basic maintenance. This includes inspecting equipment for abnormal conditions, performing preventive maintenance on pumps, motors, and inspection equipment (CCTV, vacuum testing), and understanding the difference between preventive and corrective maintenance. This module accounts for 10% of the Class 1 exam.",
    keyTopics: ["Equipment Condition Inspection", "Preventive vs. Corrective Maintenance", "Pump & Motor Maintenance", "Inspection Equipment Maintenance", "Safety Equipment Maintenance"]
  },
  "Maintain & Restore Collection System": {
    title: "Maintain & Restore Collection System",
    intro: "This module covers the cleaning, inspection, and repair of sewer lines and collection system components. Class 1 operators must understand hydraulic cleaning methods (balling, flushing, poly pigging), physical inspection techniques, pipe fittings and joining methods, and basic sewer line repair. This module accounts for 15% of the Class 1 exam.",
    keyTopics: ["Hydraulic Cleaning (Balling, Flushing, Poly Pigging)", "Physical Inspection of Sewers", "Pipe Fittings & Joining Methods", "Basic Sewer Line Repair", "Excavation & Repair Procedures"]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "Class 1 operators must understand lift station operation and basic maintenance. This includes wet well management, valve operation, lift station piping, wet well cleaning, and emergency bypass pumping procedures. This module accounts for 10% of the Class 1 exam.",
    keyTopics: ["Wet Well Operation & Management", "Lift Station Valve Operation", "Lift Station Piping & Fittings", "Wet Well Cleaning", "Emergency Bypass Pumping"]
  },
  "Monitor, Evaluate & Adjust Collection System": {
    title: "Monitor, Evaluate & Adjust Collection System",
    intro: "This is the largest module on the Class 1 exam, covering system monitoring and performance evaluation. Topics include flow monitoring, identifying inflow and infiltration (I/I), basic hydraulic principles, overflow monitoring, and regulatory compliance monitoring. This module accounts for 35% of the Class 1 exam.",
    keyTopics: ["Flow Monitoring", "Inflow & Infiltration (I/I) Identification", "Basic Hydraulic Principles", "Overflow Monitoring", "Water Quality Monitoring", "Regulatory Compliance Monitoring"]
  },
  "Security, Safety & Administrative Procedures": {
    title: "Security, Safety & Administrative Procedures",
    intro: "This module covers safety procedures, administrative functions, and security requirements. Class 1 operators must understand confined space entry procedures, traffic control, WHMIS, personal protective equipment, emergency response, spill response, regulatory reporting, and record keeping. This module accounts for 15% of the Class 1 exam.",
    keyTopics: ["Confined Space Entry Procedures", "Traffic Control", "WHMIS & PPE", "Emergency Response", "Spill Response Procedures", "Regulatory Reporting & Record Keeping"]
  }
};

const WWC_OVERVIEWS_CLASS2 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "At Class 2, operators must have application-level knowledge of all collection system equipment. This includes operating more complex pump systems, telemetry and SCADA systems, and understanding equipment interactions within the system. This module accounts for 15% of the Class 2 exam.",
    keyTopics: ["Advanced Pump System Operation", "Telemetry & SCADA Operation", "Equipment Interaction & System Balance", "Flow Control Equipment", "Generator Operation"]
  },
  "Evaluate & Maintain Equipment": {
    title: "Evaluate & Maintain Equipment",
    intro: "Class 2 operators must be able to evaluate equipment performance and develop maintenance programs. This includes analyzing pump performance curves, evaluating CCTV inspection results, and managing preventive maintenance schedules. This module accounts for 15% of the Class 2 exam.",
    keyTopics: ["Pump Performance Curve Analysis", "CCTV Inspection Evaluation", "Maintenance Program Development", "Equipment Performance Trending", "Root Cause Analysis"]
  },
  "Maintain & Restore Collection System": {
    title: "Maintain & Restore Collection System",
    intro: "At Class 2, operators must understand advanced cleaning and rehabilitation techniques including CCTV inspection and condition assessment, sewer cleaning methods, and trenchless rehabilitation technologies. This module accounts for 15% of the Class 2 exam.",
    keyTopics: ["CCTV Inspection & Condition Assessment", "Advanced Sewer Cleaning Methods", "Trenchless Rehabilitation Technologies", "Pipe Lining & Sliplining", "Sewer Replacement Planning"]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "Class 2 operators must have advanced knowledge of lift station management including wet well hydraulics, force main operation, pump selection, and lift station optimization. This module accounts for 10% of the Class 2 exam.",
    keyTopics: ["Wet Well Hydraulics", "Force Main Operation & Maintenance", "Pump Selection & Sizing", "Lift Station Optimization", "Electrical Systems at Lift Stations"]
  },
  "Monitor, Evaluate & Adjust Collection System": {
    title: "Monitor, Evaluate & Adjust Collection System",
    intro: "At Class 2, this module covers advanced system monitoring including hydraulic analysis, I/I quantification, sewer system evaluation surveys (SSES), and combined sewer overflow (CSO) monitoring. This module accounts for 30% of the Class 2 exam.",
    keyTopics: ["Hydraulic Analysis", "I/I Quantification & Control", "Sewer System Evaluation Surveys (SSES)", "CSO Monitoring & Reporting", "Flow Data Analysis", "System Performance Evaluation"]
  },
  "Security, Safety & Administrative Procedures": {
    title: "Security, Safety & Administrative Procedures",
    intro: "At Class 2, the administrative module expands to include regulatory reporting programs, spill response planning, and more complex safety program management. This module accounts for 15% of the Class 2 exam.",
    keyTopics: ["Regulatory Reporting Programs", "Spill Response Planning", "Safety Program Management", "Emergency Response Plans", "Record Keeping Systems", "Public Communication"]
  }
};

const WWC_OVERVIEWS_CLASS3 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "At Class 3, operators must have analysis-level knowledge of all collection system equipment, including the ability to evaluate equipment performance, optimize system operations, and make decisions about equipment upgrades. This module accounts for 15% of the Class 3 exam.",
    keyTopics: ["Equipment Performance Analysis", "System Optimization", "Equipment Upgrade Decisions", "Advanced SCADA & Automation", "Energy Efficiency Management"]
  },
  "Evaluate & Maintain Equipment": {
    title: "Evaluate & Maintain Equipment",
    intro: "Class 3 operators must be able to conduct comprehensive equipment evaluations, develop asset management strategies, and oversee complex maintenance programs. This module accounts for 15% of the Class 3 exam.",
    keyTopics: ["Comprehensive Equipment Evaluation", "Asset Management Strategies", "Maintenance Program Oversight", "Life Cycle Cost Analysis", "Reliability-Centered Maintenance"]
  },
  "Maintain & Restore Collection System": {
    title: "Maintain & Restore Collection System",
    intro: "At Class 3, operators must understand advanced rehabilitation planning, condition assessment programs, and long-term infrastructure management strategies. This module accounts for 15% of the Class 3 exam.",
    keyTopics: ["Condition Assessment Programs", "Rehabilitation Planning", "Asset Management for Collection Systems", "Advanced Trenchless Technologies", "Infrastructure Renewal Planning"]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "Class 3 operators must have advanced knowledge of lift station design considerations, force main transient analysis, and lift station optimization programs. This module accounts for 10% of the Class 3 exam.",
    keyTopics: ["Lift Station Design Considerations", "Force Main Transient Analysis", "Lift Station Optimization Programs", "Wet Well Design & Sizing", "Pump Station Automation"]
  },
  "Monitor, Evaluate & Adjust Collection System": {
    title: "Monitor, Evaluate & Adjust Collection System",
    intro: "At Class 3, this module covers advanced hydraulic modeling, CSO control planning, and comprehensive system performance management. This module accounts for 25% of the Class 3 exam.",
    keyTopics: ["Advanced Hydraulic Modeling", "CSO Control Planning", "System Performance Management", "Capacity Management", "Wet Weather Flow Management", "Environmental Impact Assessment"]
  },
  "Security, Safety & Administrative Procedures": {
    title: "Security, Safety & Administrative Procedures",
    intro: "At Class 3, the administrative module covers management of safety programs, regulatory compliance programs, and organizational leadership in emergency response. This module accounts for 20% of the Class 3 exam.",
    keyTopics: ["Safety Program Management", "Regulatory Compliance Programs", "Emergency Management Leadership", "Environmental Compliance", "Staff Training Programs", "Regulatory Reporting Systems"]
  }
};

const WWC_OVERVIEWS_CLASS4 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "At Class 4, operators must have mastery-level knowledge of all collection system equipment and be able to provide technical leadership in equipment selection, procurement, and system-wide optimization. This module accounts for 15% of the Class 4 exam.",
    keyTopics: ["Technical Leadership in Equipment Management", "System-Wide Optimization", "Equipment Procurement & Specification", "Advanced Automation & Control", "Energy Management Programs"]
  },
  "Evaluate & Maintain Equipment": {
    title: "Evaluate & Maintain Equipment",
    intro: "Class 4 operators must be able to lead organization-wide asset management programs, conduct risk-based maintenance planning, and make strategic decisions about infrastructure investment. This module accounts for 15% of the Class 4 exam.",
    keyTopics: ["Risk-Based Asset Management (ISO 55000)", "Strategic Maintenance Planning", "Infrastructure Investment Decisions", "Asset Performance Management", "Capital Planning"]
  },
  "Maintain & Restore Collection System": {
    title: "Maintain & Restore Collection System",
    intro: "At Class 4, operators must understand long-term infrastructure planning, risk-based asset management for collection systems, and strategic rehabilitation programs. This module accounts for 15% of the Class 4 exam.",
    keyTopics: ["Long-Term Infrastructure Planning", "Risk-Based Rehabilitation Programs", "Strategic Asset Management", "Capital Investment Planning", "Sustainability in Collection Systems"]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "Class 4 operators must have strategic-level knowledge of lift station management including system-wide capacity planning, force main network management, and long-term infrastructure planning for pumping infrastructure. This module accounts for 10% of the Class 4 exam.",
    keyTopics: ["System-Wide Capacity Planning", "Force Main Network Management", "Long-Term Pumping Infrastructure Planning", "Lift Station Optimization Programs", "Energy Management for Pumping"]
  },
  "Monitor, Evaluate & Adjust Collection System": {
    title: "Monitor, Evaluate & Adjust Collection System",
    intro: "At Class 4, this module covers strategic system management including long-term control plans (LTCPs) for CSOs, capacity management programs, and performance management systems. This module accounts for 25% of the Class 4 exam.",
    keyTopics: ["Long-Term Control Plans (LTCPs) for CSOs", "Capacity Management Programs", "Performance Management Systems", "Regulatory Strategy & Compliance", "Environmental Management Programs", "Strategic System Planning"]
  },
  "Security, Safety & Administrative Procedures": {
    title: "Security, Safety & Administrative Procedures",
    intro: "At Class 4, the administrative module covers senior management responsibilities including organizational leadership, strategic planning, regulatory leadership, and emergency management programs at the organizational level. This module accounts for 20% of the Class 4 exam.",
    keyTopics: ["Organizational Leadership", "Strategic Planning", "Regulatory Leadership & Environmental Compliance", "Emergency Management Programs", "Performance Management & KPIs", "Stakeholder & Public Communication"]
  }
};

// ─── BANK MAPPING ─────────────────────────────────────────────────────────────

const BANK_OVERVIEWS = {
  "class1-water-dist":      WD_OVERVIEWS_CLASS1,
  "class2-water-dist":      WD_OVERVIEWS_CLASS2,
  "class3-water-dist":      WD_OVERVIEWS_CLASS3,
  "class4-water-dist":      WD_OVERVIEWS_CLASS4,
  "class1-wastewater-coll": WWC_OVERVIEWS_CLASS1,
  "class2-wastewater-coll": WWC_OVERVIEWS_CLASS2,
  "class3-wastewater-coll": WWC_OVERVIEWS_CLASS3,
  "class4-wastewater-coll": WWC_OVERVIEWS_CLASS4,
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  for (const [bankKey, overviews] of Object.entries(BANK_OVERVIEWS)) {
    const overviewsJson = JSON.stringify(overviews);
    const [result] = await conn.execute(
      `UPDATE module_overviews SET overviewsJson = ? WHERE bankKey = ?`,
      [overviewsJson, bankKey]
    );
    if (result.affectedRows === 0) {
      // Insert if not exists
      await conn.execute(
        `INSERT INTO module_overviews (bankKey, overviewsJson) VALUES (?, ?)`,
        [bankKey, overviewsJson]
      );
      console.log(`✅ Inserted overviews for ${bankKey}`);
    } else {
      console.log(`✅ Updated overviews for ${bankKey}`);
    }
  }

  await conn.end();
  console.log("\nAll module overviews updated!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
