import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/* =========================================================
   SAMPLE DATA
   ========================================================= */

const sampleSubscriptions = [
  {
    merchant: "Netflix",
    amount: 649,
    category: "Entertainment",
    cadence: "Monthly",
    status: "Active",
    nextBilling: "2026-10-05",
  },
  {
    merchant: "Spotify",
    amount: 119,
    category: "Entertainment",
    cadence: "Monthly",
    status: "Active",
    nextBilling: "2026-10-08",
  },
  {
    merchant: "Gym Membership",
    amount: 1499,
    category: "Fitness",
    cadence: "Monthly",
    status: "Active",
    nextBilling: "2026-10-01",
  },
  {
    merchant: "Cloud Storage",
    amount: 199,
    category: "Cloud Storage",
    cadence: "Monthly",
    status: "Active",
    nextBilling: "2026-10-12",
  },
  {
    merchant: "Amazon Prime",
    amount: 299,
    category: "Shopping",
    cadence: "Monthly",
    status: "Active",
    nextBilling: "2026-10-15",
  },
  {
    merchant: "Adobe Creative Cloud",
    amount: 899,
    category: "Software",
    cadence: "Monthly",
    status: "Active",
    nextBilling: "2026-10-18",
  },
];

const sampleTransactions = [
  {
    merchant: "Netflix",
    amount: 649,
    date: "2026-09-05",
    description: "Netflix monthly subscription",
    category: "Entertainment",
    last_used_days_ago: 4,
  },
  {
    merchant: "Spotify",
    amount: 119,
    date: "2026-09-08",
    description: "Spotify Premium",
    category: "Entertainment",
    last_used_days_ago: 2,
  },
  {
    merchant: "Gym Membership",
    amount: 1499,
    date: "2026-09-01",
    description: "Monthly gym membership",
    category: "Fitness",
    last_used_days_ago: 45,
  },
  {
    merchant: "Cloud Storage",
    amount: 199,
    date: "2026-09-12",
    description: "Cloud storage renewal",
    category: "Cloud Storage",
    last_used_days_ago: 12,
  },
  {
    merchant: "Amazon Prime",
    amount: 299,
    date: "2026-09-15",
    description: "Prime membership renewal",
    category: "Shopping",
    last_used_days_ago: 7,
  },
  {
    merchant: "Adobe Creative Cloud",
    amount: 899,
    date: "2026-09-18",
    description: "Adobe Creative Cloud renewal",
    category: "Software",
    last_used_days_ago: 90,
  },
];

const sampleEmails = [
  {
    merchant: "Netflix",
    subject: "Your Netflix payment was processed",
    body: "Your monthly Netflix subscription payment has been processed.",
  },
  {
    merchant: "Spotify",
    subject: "Your Spotify Premium renewal",
    body: "Your Spotify Premium subscription has renewed.",
  },
  {
    merchant: "Gym Membership",
    subject: "Gym membership payment",
    body: "Your monthly membership payment has been received.",
  },
  {
    merchant: "Cloud Storage",
    subject: "Cloud storage renewal",
    body: "Your cloud storage subscription has renewed.",
  },
  {
    merchant: "Amazon Prime",
    subject: "Your Prime membership payment",
    body: "Your Prime membership payment was processed.",
  },
  {
    merchant: "Adobe Creative Cloud",
    subject: "Adobe subscription payment",
    body: "Your Adobe Creative Cloud subscription has renewed.",
  },
];

/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  trialAlerts: true,
  priceAlerts: true,
  weeklyReports: true,
  aiRecommendations: true,

  explanationLevel: "Detailed",
  confidenceThreshold: "Medium",

  protectedCategories: "Rent, Education, Healthcare",

  monthlyLimit: 5000,
  autoActionLimit: 500,

  appearance: "System",

  sessionAlerts: true,
  dataProcessing: true,

  bankConnected: false,
  emailConnected: false,

  monthlyReports: true,
};

/* =========================================================
   SETTINGS MENU
   ========================================================= */

const settingsMenu = [
  {
    id: "account",
    label: "Account",
    icon: "👤",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "🔔",
  },
  {
    id: "ai",
    label: "AI Guardian",
    icon: "🤖",
  },
  {
    id: "spending",
    label: "Spending Rules",
    icon: "💰",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: "🎨",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: "🔒",
  },
  {
    id: "connected",
    label: "Connected Accounts",
    icon: "🔗",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "📊",
  },
  {
    id: "help",
    label: "Help",
    icon: "❓",
  },
  {
    id: "legal",
    label: "Legal",
    icon: "📄",
  },
];

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getMerchantInitial(merchant) {
  return merchant?.charAt(0)?.toUpperCase() || "?";
}

function getProtectedCategories(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
   TOGGLE ROW
   ========================================================= */

function ToggleRow({
  label,
  description,
  value,
  onChange,
}) {
  return (
    <div className="setting-row">
      <div className="setting-label">
        <strong>{label}</strong>

        {description && (
          <div className="setting-description">
            {description}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`toggle ${value ? "active" : ""}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={`${label}: ${
          value ? "enabled" : "disabled"
        }`}
      />
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function DashboardPage({
  subscriptions,
  transactions,
  protectedCategories,
  onRunAudit,
}) {
  const monthlySpend = subscriptions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <>
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-eyebrow">
            SUBSCRIPTION & RECURRING-SPEND GUARDIAN
          </div>

          <h2>
            Find the money you're quietly leaking every
            month.
          </h2>

          <p>
            Your AI Guardian scans recurring transactions,
            subscription emails, price changes and usage
            patterns to identify subscriptions that may need
            attention.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => onRunAudit("ai")}
            >
              🤖 Run Agent Audit
            </button>

            <button className="secondary-button">
              View Subscriptions
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="orb">🛡️</div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              Active Subscriptions
            </div>

            <div className="stat-value">
              {subscriptions.length}
            </div>

            <div className="stat-description">
              Recurring services detected
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Monthly Recurring Spend
            </div>

            <div className="stat-value">
              {formatCurrency(monthlySpend)}
            </div>

            <div className="stat-description">
              Estimated recurring monthly cost
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Agent Signals
            </div>

            <div className="stat-value">
              {transactions.length}
            </div>

            <div className="stat-description">
              Transactions available for analysis
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Potential Savings
            </div>

            <div className="stat-value">
              ₹2,348
            </div>

            <div className="stat-description">
              Estimated opportunities
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Subscriptions</h2>
            <p>Your detected recurring services</p>
          </div>
        </div>

        <div className="subscription-grid">
          {subscriptions.slice(0, 4).map((subscription) => (
            <div
              className="subscription-card"
              key={subscription.merchant}
            >
              <div className="subscription-card-header">
                <div className="merchant-icon">
                  {getMerchantInitial(
                    subscription.merchant
                  )}
                </div>

                <span className="status-pill">
                  {subscription.status}
                </span>
              </div>

              <h3>{subscription.merchant}</h3>

              <div className="subscription-category">
                {subscription.category}
              </div>

              <div className="subscription-price">
                {formatCurrency(subscription.amount)}
              </div>

              <div className="subscription-billing">
                {subscription.cadence}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="content-card protected-card">
          <div>
            <h3>🛡️ Protected Categories</h3>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginTop: "5px",
              }}
            >
              The Guardian will not automatically act on
              protected categories.
            </p>
          </div>

          <div className="protected-pills">
            {protectedCategories.map((category) => (
              <span
                className="protected-pill"
                key={category}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SUBSCRIPTIONS PAGE
   ========================================================= */

function SubscriptionsPage({ subscriptions }) {
  return (
    <div className="page-section">
      <div className="section-heading">
        <div>
          <h2>All Subscriptions</h2>
          <p>
            Recurring services detected by Subscription
            Guardian.
          </p>
        </div>
      </div>

      <div className="content-card table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Next Billing</th>
              </tr>
            </thead>

            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.merchant}>
                  <td>{subscription.merchant}</td>

                  <td>{subscription.category}</td>

                  <td className="amount-cell">
                    {formatCurrency(subscription.amount)}
                  </td>

                  <td>{subscription.cadence}</td>

                  <td>
                    <span className="status-pill">
                      {subscription.status}
                    </span>
                  </td>

                  <td>{subscription.nextBilling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: "22px" }}>
        <h3>🤖 AI Subscription Review</h3>

        <p
          style={{
            marginTop: "8px",
            color: "var(--text-secondary)",
            fontSize: "12px",
            lineHeight: "1.7",
          }}
        >
          Run the AI Agent Audit to identify potentially
          wasteful subscriptions, unused services, price
          changes and overlapping subscriptions.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   AI AUDIT PAGE
   ========================================================= */

function AgentAIPage({
  auditResult,
  onRunAudit,
  dismissedDecisions,
  setDismissedDecisions,
  settings,
}) {
  const decisions =
    auditResult?.decisions ||
    auditResult?.results ||
    auditResult?.subscriptions ||
    [];

  const visibleDecisions = decisions.filter(
    (_, index) => !dismissedDecisions.includes(index)
  );

  const dismissDecision = (index) => {
    setDismissedDecisions((previous) => [
      ...previous,
      index,
    ]);
  };

  return (
    <div className="page-section">
      <div className="agent-hero">
        <h2>🤖 AI Guardian Audit</h2>

        <p>
          The AI Guardian evaluates recurring charges,
          usage patterns, protected categories and spending
          guardrails before recommending an action.
        </p>

        <div style={{ marginTop: "18px" }}>
          <button
            className="primary-button"
            onClick={() => onRunAudit("ai")}
          >
            Run Agent Audit
          </button>
        </div>
      </div>

      {auditResult && (
        <div className="stats-grid" style={{ marginBottom: "26px" }}>
          <div className="stat-card">
            <div className="stat-label">
              Subscriptions Scanned
            </div>

            <div className="stat-value">
              {auditResult.subscriptions_scanned ??
                decisions.length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Signals Found</div>

            <div className="stat-value">
              {auditResult.signals_found ??
                decisions.length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Protected</div>

            <div className="stat-value">
              {auditResult.protected_count ?? 0}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Potential Savings
            </div>

            <div className="stat-value">
              {formatCurrency(
                auditResult.potential_monthly_savings ?? 0
              )}
            </div>
          </div>
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>Action Queue</h2>
          <p>
            Recommendations generated by the Guardian
            Agent.
          </p>
        </div>
      </div>

      {!auditResult ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>

          <h3>No AI audit has been run</h3>

          <p>
            Run the Guardian Agent to scan your recurring
            spending and generate recommendations.
          </p>

          <button
            className="primary-button"
            onClick={() => onRunAudit("ai")}
          >
            Run Agent Audit
          </button>
        </div>
      ) : visibleDecisions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>

          <h3>All audit items dismissed</h3>

          <p>
            There are currently no visible recommendations
            in your action queue.
          </p>
        </div>
      ) : (
        <div className="agent-action-grid">
          {visibleDecisions.map((decision, index) => {
            const wasteScore = Number(
              decision.waste_score ??
                decision.wasteScore ??
                0
            );

            const confidenceScore = Number(
              decision.confidence_score ??
                decision.confidenceScore ??
                0
            );

            const action =
              decision.action ||
              decision.recommended_action ||
              "review";

            const risk =
              wasteScore >= 70
                ? "high"
                : wasteScore >= 40
                ? "medium"
                : "low";

            const amount = Number(
              decision.amount || 0
            );

            return (
              <div
                className={`agent-action-card ${risk}`}
                key={`${decision.merchant || "item"}-${index}`}
              >
                <div className="agent-card-header">
                  <div className="agent-merchant">
                    <h3>
                      {decision.merchant ||
                        "Unknown Subscription"}
                    </h3>

                    <p>
                      {formatCurrency(amount)} / month
                    </p>
                  </div>

                  <span className={`risk-pill ${risk}`}>
                    {String(action).toUpperCase()}
                  </span>
                </div>

                <div className="agent-score-grid">
                  <div className="agent-score-card waste">
                    <div className="agent-score-label">
                      Waste Score
                    </div>

                    <div className="agent-score-value">
                      {wasteScore}
                    </div>

                    <div className="agent-score-description">
                      Higher score indicates greater
                      potential waste.
                    </div>
                  </div>

                  <div className="agent-score-card confidence">
                    <div className="agent-score-label">
                      Confidence Score
                    </div>

                    <div className="agent-score-value">
                      {confidenceScore}
                    </div>

                    <div className="agent-score-description">
                      Confidence in the AI recommendation.
                    </div>
                  </div>
                </div>

                <div className="agent-details">
                  <div className="agent-detail">
                    <span className="agent-detail-label">
                      Category
                    </span>

                    <span className="agent-detail-value">
                      {decision.category || "Unknown"}
                    </span>
                  </div>

                  <div className="agent-detail">
                    <span className="agent-detail-label">
                      Billing
                    </span>

                    <span className="agent-detail-value">
                      {decision.cadence || "Monthly"}
                    </span>
                  </div>
                </div>

                {decision.protected && (
                  <div className="protected-alert">
                    🛡️{" "}
                    <strong>Protected Category</strong>
                    <br />
                    This subscription is protected from
                    automatic actions.
                  </div>
                )}

                {decision.guardrail && (
                  <div className="guardrail-alert">
                    ⚙️ <strong>Guardrail</strong>
                    <br />
                    {decision.guardrail}
                  </div>
                )}

                <div className="agent-explanation">
                  <strong>🤖 Agent Explanation</strong>
                  <br />

                  {decision.explanation ||
                    decision.reason ||
                    "The Guardian detected a recurring charge that may require review."}
                </div>

                <div className="agent-savings-row">
                  <span className="agent-savings-label">
                    Potential Monthly Savings
                  </span>

                  <span className="agent-savings-value">
                    {formatCurrency(
                      decision.potential_savings ??
                        decision.savings ??
                        (risk === "high" ? amount : 0)
                    )}
                  </span>
                </div>

                <div className="agent-dismiss-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      dismissDecision(index)
                    }
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="content-card" style={{ marginTop: "26px" }}>
        <h3>⚙️ Configured Guardrails</h3>

        <div
          className="agent-details"
          style={{ marginTop: "18px" }}
        >
          <div className="agent-detail">
            <span className="agent-detail-label">
              Monthly Limit
            </span>

            <span className="agent-detail-value">
              {formatCurrency(settings.monthlyLimit)}
            </span>
          </div>

          <div className="agent-detail">
            <span className="agent-detail-label">
              Auto Action Limit
            </span>

            <span className="agent-detail-value">
              {formatCurrency(settings.autoActionLimit)}
            </span>
          </div>

          <div className="agent-detail">
            <span className="agent-detail-label">
              Confidence Threshold
            </span>

            <span className="agent-detail-value">
              {settings.confidenceThreshold}
            </span>
          </div>

          <div className="agent-detail">
            <span className="agent-detail-label">
              Protected Categories
            </span>

            <span className="agent-detail-value">
              {settings.protectedCategories}
            </span>
          </div>
        </div>
      </div>

      <div className="info-banner">
        ℹ️ This prototype uses simulated subscription and
        transaction data. Automatic actions should only be
        enabled when the relevant account permissions and
        guardrails have been configured.
      </div>
    </div>
  );
}

/* =========================================================
   AI INSIGHTS
   ========================================================= */

function AIInsightsPage({
  auditResult,
  settings,
  onRunAudit,
}) {
  return (
    <div className="page-section">
      <div className="section-heading">
        <div>
          <h2>AI Insights</h2>
          <p>
            Understand why the Guardian generated its
            recommendations.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => onRunAudit("insights")}
        >
          Refresh AI Insights
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">High Waste</div>
          <div className="stat-value">2</div>
          <div className="stat-description">
            Items requiring attention
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Medium Waste</div>
          <div className="stat-value">2</div>
          <div className="stat-description">
            Items worth reviewing
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Confidence Threshold
          </div>

          <div className="stat-value">
            {settings.confidenceThreshold}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Protected Rules
          </div>

          <div className="stat-value">
            {getProtectedCategories(
              settings.protectedCategories
            ).length}
          </div>
        </div>
      </div>

      <div className="insight-grid" style={{ marginTop: "25px" }}>
        <div className="insight-card">
          <h3>🧠 Guardian Analysis</h3>

          <p>
            The Guardian compares recurring charges against
            transaction history, usage signals, category
            protection rules and configured spending
            guardrails.
          </p>

          {auditResult && (
            <p style={{ marginTop: "12px" }}>
              Latest audit has been completed and its
              recommendations are available in AI Audit.
            </p>
          )}
        </div>

        <div className="insight-card">
          <h3>📈 Score Interpretation</h3>

          <p>
            Waste Score estimates how much attention a
            recurring expense may deserve. Confidence Score
            indicates how strongly the available evidence
            supports the recommendation.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTIONS PAGE
   ========================================================= */

function TransactionsPage({
  transactions,
  setTransactions,
  onUpload,
}) {
  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    await onUpload(file);

    event.target.value = "";
  };

  return (
    <div className="page-section">
      <div className="section-heading">
        <div>
          <h2>Transactions</h2>

          <p>
            Transaction history used by the Guardian Agent.
          </p>
        </div>

        <label className="primary-button upload-button">
          Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleUpload}
          />
        </label>
      </div>

      <div className="content-card table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No transactions available.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => (
                  <tr key={`${transaction.merchant}-${index}`}>
                    <td>{transaction.merchant}</td>

                    <td>
                      {transaction.category || "Unknown"}
                    </td>

                    <td className="amount-cell">
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td>{transaction.date}</td>

                    <td>{transaction.description}</td>

                    <td className="table-action">
                      <button className="secondary-button transaction-dismiss-button">
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS PAGE
   ========================================================= */

function SettingsPage({
  settings,
  setSettings,
  settingsSection,
  setSettingsSection,
}) {
  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  return (
    <div className="page-section">
      <div className="settings-layout">
        <div className="settings-menu">
          {settingsMenu.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`settings-menu-item ${
                settingsSection === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSettingsSection(item.id)
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content-area">
          {/* ACCOUNT */}
          {settingsSection === "account" && (
            <>
              <div className="settings-header">
                <h2>Account</h2>
                <p>
                  Manage your Subscription Guardian account.
                </p>
              </div>

              <div className="setting-card">
                <h3>Account Information</h3>

                <p>
                  Update the email address associated with
                  your account.
                </p>

                <div className="settings-form">
                  <div>
                    <label className="setting-description">
                      Email Address
                    </label>

                    <input
                      className="settings-input"
                      type="email"
                      placeholder="you@example.com"
                    />
                  </div>

                  <button className="primary-button">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="setting-card">
                <h3>Change Password</h3>

                <p>
                  Update your account password.
                </p>

                <div className="settings-form">
                  <input
                    type="password"
                    placeholder="Current password"
                  />

                  <input
                    type="password"
                    placeholder="New password"
                  />

                  <button className="primary-button">
                    Change Password
                  </button>
                </div>
              </div>
            </>
          )}

          {/* NOTIFICATIONS */}
          {settingsSection === "notifications" && (
            <>
              <div className="settings-header">
                <h2>Notifications</h2>

                <p>
                  Control when Subscription Guardian sends
                  alerts and reports.
                </p>
              </div>

              <div className="setting-card">
                <h3>Notification Preferences</h3>

                <p>
                  Enable or disable individual notification
                  types.
                </p>

                <div className="settings-form">
                  <ToggleRow
                    label="Email Notifications"
                    description="Receive important subscription alerts by email."
                    value={settings.emailNotifications}
                    onChange={(value) =>
                      updateSetting(
                        "emailNotifications",
                        value
                      )
                    }
                  />

                  <ToggleRow
                    label="Trial Alerts"
                    description="Get notified before free trials convert into paid subscriptions."
                    value={settings.trialAlerts}
                    onChange={(value) =>
                      updateSetting(
                        "trialAlerts",
                        value
                      )
                    }
                  />

                  <ToggleRow
                    label="Price Increase Alerts"
                    description="Get notified when a recurring subscription price increases."
                    value={settings.priceAlerts}
                    onChange={(value) =>
                      updateSetting(
                        "priceAlerts",
                        value
                      )
                    }
                  />

                  <ToggleRow
                    label="Weekly Reports"
                    description="Receive a weekly summary of recurring spending and detected waste."
                    value={settings.weeklyReports}
                    onChange={(value) =>
                      updateSetting(
                        "weeklyReports",
                        value
                      )
                    }
                  />

                  <ToggleRow
                    label="Monthly Reports"
                    description="Receive a monthly subscription spending summary."
                    value={settings.monthlyReports}
                    onChange={(value) =>
                      updateSetting(
                        "monthlyReports",
                        value
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* AI */}
          {settingsSection === "ai" && (
            <>
              <div className="settings-header">
                <h2>AI Guardian</h2>

                <p>
                  Configure how the Guardian Agent analyzes
                  your spending.
                </p>
              </div>

              <div className="setting-card">
                <h3>AI Recommendations</h3>

                <p>
                  Control AI-powered subscription
                  recommendations.
                </p>

                <ToggleRow
                  label="AI Recommendations"
                  description="Allow the Guardian to generate subscription recommendations."
                  value={settings.aiRecommendations}
                  onChange={(value) =>
                    updateSetting(
                      "aiRecommendations",
                      value
                    )
                  }
                />
              </div>

              <div className="setting-card">
                <h3>Analysis Preferences</h3>

                <div className="settings-form">
                  <label className="setting-description">
                    Explanation Level
                  </label>

                  <select
                    className="settings-input"
                    value={settings.explanationLevel}
                    onChange={(event) =>
                      updateSetting(
                        "explanationLevel",
                        event.target.value
                      )
                    }
                  >
                    <option>Brief</option>
                    <option>Detailed</option>
                    <option>Very Detailed</option>
                  </select>

                  <label className="setting-description">
                    Confidence Threshold
                  </label>

                  <select
                    className="settings-input"
                    value={settings.confidenceThreshold}
                    onChange={(event) =>
                      updateSetting(
                        "confidenceThreshold",
                        event.target.value
                      )
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  <label className="setting-description">
                    Protected Categories
                  </label>

                  <input
                    className="settings-input"
                    value={settings.protectedCategories}
                    onChange={(event) =>
                      updateSetting(
                        "protectedCategories",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* SPENDING */}
          {settingsSection === "spending" && (
            <>
              <div className="settings-header">
                <h2>Spending Rules</h2>

                <p>
                  Configure the limits used by the Guardian
                  Agent.
                </p>
              </div>

              <div className="setting-card">
                <h3>Guardian Limits</h3>

                <div className="settings-form">
                  <label className="setting-description">
                    Monthly Spending Limit
                  </label>

                  <input
                    className="settings-input"
                    type="number"
                    value={settings.monthlyLimit}
                    onChange={(event) =>
                      updateSetting(
                        "monthlyLimit",
                        Number(event.target.value)
                      )
                    }
                  />

                  <label className="setting-description">
                    Automatic Action Limit
                  </label>

                  <input
                    className="settings-input"
                    type="number"
                    value={settings.autoActionLimit}
                    onChange={(event) =>
                      updateSetting(
                        "autoActionLimit",
                        Number(event.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="setting-card">
                <h3>Protected Categories</h3>

                <p>
                  These categories require additional
                  protection.
                </p>

                <div className="protected-pills">
                  {getProtectedCategories(
                    settings.protectedCategories
                  ).map((category) => (
                    <span
                      className="protected-pill"
                      key={category}
                    >
                      🛡️ {category}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* APPEARANCE */}
          {settingsSection === "appearance" && (
            <>
              <div className="settings-header">
                <h2>Appearance</h2>

                <p>
                  Choose how Subscription Guardian looks.
                </p>
              </div>

              <div className="setting-card">
                <h3>Theme</h3>

                <p>
                  Select System, Light or Dark appearance.
                </p>

                <select
                  className="settings-input"
                  value={settings.appearance}
                  onChange={(event) =>
                    updateSetting(
                      "appearance",
                      event.target.value
                    )
                  }
                >
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
            </>
          )}

          {/* PRIVACY */}
          {settingsSection === "privacy" && (
            <>
              <div className="settings-header">
                <h2>Privacy</h2>

                <p>
                  Control how Guardian processes your data.
                </p>
              </div>

              <div className="setting-card">
                <h3>Privacy Controls</h3>

                <ToggleRow
                  label="Session Alerts"
                  description="Receive alerts about important account sessions."
                  value={settings.sessionAlerts}
                  onChange={(value) =>
                    updateSetting(
                      "sessionAlerts",
                      value
                    )
                  }
                />

                <ToggleRow
                  label="Data Processing"
                  description="Allow Guardian to process transaction and subscription data for analysis."
                  value={settings.dataProcessing}
                  onChange={(value) =>
                    updateSetting(
                      "dataProcessing",
                      value
                    )
                  }
                />
              </div>
            </>
          )}

          {/* CONNECTED ACCOUNTS */}
          {settingsSection === "connected" && (
            <>
              <div className="settings-header">
                <h2>Connected Accounts</h2>

                <p>
                  Connect sources used by the Guardian
                  Agent.
                </p>
              </div>

              <div className="setting-card">
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>🏦 Bank Account</strong>

                    <div className="setting-description">
                      Import transaction history.
                    </div>
                  </div>

                  <button
                    className={
                      settings.bankConnected
                        ? "secondary-button"
                        : "primary-button"
                    }
                    onClick={() =>
                      updateSetting(
                        "bankConnected",
                        !settings.bankConnected
                      )
                    }
                  >
                    {settings.bankConnected
                      ? "Connected"
                      : "Connect"}
                  </button>
                </div>

                <div className="setting-row">
                  <div className="setting-label">
                    <strong>📧 Email Account</strong>

                    <div className="setting-description">
                      Scan subscription and renewal emails.
                    </div>
                  </div>

                  <button
                    className={
                      settings.emailConnected
                        ? "secondary-button"
                        : "primary-button"
                    }
                    onClick={() =>
                      updateSetting(
                        "emailConnected",
                        !settings.emailConnected
                      )
                    }
                  >
                    {settings.emailConnected
                      ? "Connected"
                      : "Connect"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* REPORTS */}
          {settingsSection === "reports" && (
            <>
              <div className="settings-header">
                <h2>Reports</h2>

                <p>
                  Configure recurring spending reports.
                </p>
              </div>

              <div className="setting-card">
                <ToggleRow
                  label="Weekly Reports"
                  description="Receive a weekly Guardian spending report."
                  value={settings.weeklyReports}
                  onChange={(value) =>
                    updateSetting(
                      "weeklyReports",
                      value
                    )
                  }
                />

                <ToggleRow
                  label="Monthly Reports"
                  description="Receive a monthly recurring-spend report."
                  value={settings.monthlyReports}
                  onChange={(value) =>
                    updateSetting(
                      "monthlyReports",
                      value
                    )
                  }
                />
              </div>
            </>
          )}

          {/* HELP */}
          {settingsSection === "help" && (
            <>
              <div className="settings-header">
                <h2>Help</h2>

                <p>
                  Learn how Subscription Guardian works.
                </p>
              </div>

              <div className="setting-card">
                <h3>How Guardian Works</h3>

                <p>
                  Guardian scans recurring transaction
                  patterns and available subscription signals,
                  calculates waste and confidence scores,
                  checks your guardrails and presents
                  recommendations.
                </p>
              </div>
            </>
          )}

          {/* LEGAL */}
          {settingsSection === "legal" && (
            <>
              <div className="settings-header">
                <h2>Legal</h2>

                <p>
                  Important information about the prototype.
                </p>
              </div>

              <div className="setting-card">
                <h3>Prototype Notice</h3>

                <p>
                  This application is a prototype for an
                  agentic AI workflow. Recommendations should
                  be reviewed before taking consequential
                  actions.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   AUTH PAGE
   ========================================================= */

function AuthPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    localStorage.setItem(
      "guardian_user_email",
      email
    );

    localStorage.setItem(
      "guardian_session",
      "true"
    );

    onLogin();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🛡️</div>

        <h1>Subscription Guardian</h1>

        <p className="auth-subtitle">
          AI-powered protection against forgotten
          subscriptions and recurring spending.
        </p>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="primary-button full-width"
          >
            Sign In
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <button
          className="secondary-button full-width"
          onClick={() => {
            localStorage.setItem(
              "guardian_user_email",
              "demo@example.com"
            );

            localStorage.setItem(
              "guardian_session",
              "true"
            );

            onLogin();
          }}
        >
          Continue with Demo Account
        </button>

        <div className="demo-box">
          <strong>Prototype Demo</strong>
          <br />
          Use any email and password to enter the
          prototype.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [authenticated, setAuthenticated] =
    useState(
      localStorage.getItem(
        "guardian_session"
      ) === "true"
    );

  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [settingsSection, setSettingsSection] =
    useState("account");

  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [subscriptions] =
    useState(sampleSubscriptions);

  const [transactions, setTransactions] =
    useState(sampleTransactions);

  const [auditResult, setAuditResult] =
    useState(null);

  const [dismissedDecisions, setDismissedDecisions] =
    useState([]);

  const [backendAvailable, setBackendAvailable] =
    useState(true);

  /* =======================================================
     THEME
     ======================================================= */

  useEffect(() => {
    let theme = settings.appearance;

    if (theme === "System") {
      theme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "Dark"
        : "Light";
    }

    document.documentElement.setAttribute(
      "data-theme",
      theme.toLowerCase()
    );
  }, [settings.appearance]);

  /* =======================================================
     BACKEND CHECK
     ======================================================= */

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        setBackendAvailable(response.ok);
      })
      .catch(() => {
        setBackendAvailable(false);
      });
  }, []);

  /* =======================================================
     RUN AUDIT
     ======================================================= */

  const runAudit = async (targetTab = "ai") => {
    try {
      const protectedCategories =
        getProtectedCategories(
          settings.protectedCategories
        );

      const response = await fetch("/api/audit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          charges: transactions,

          emails: sampleEmails,

          auto_action_limit: Number(
            settings.autoActionLimit || 500
          ),

          protected_categories:
            protectedCategories,
        }),
      });

      if (!response.ok) {
        throw new Error("Audit request failed");
      }

      const data = await response.json();

      setAuditResult(data);

      setDismissedDecisions([]);

      setActiveTab(targetTab);
    } catch (error) {
      console.error(error);

      /*
       * Fallback demo audit.
       * This keeps the UI usable even when the backend
       * is temporarily unavailable.
       */

      const fallbackDecisions =
        transactions.map((transaction) => {
          const days =
            Number(
              transaction.last_used_days_ago
            ) || 0;

          const wasteScore =
            days >= 60
              ? 90
              : days >= 30
              ? 75
              : days >= 14
              ? 55
              : 25;

          const protectedCategory =
            getProtectedCategories(
              settings.protectedCategories
            ).some(
              (category) =>
                category.toLowerCase() ===
                String(
                  transaction.category || ""
                ).toLowerCase()
            );

          return {
            merchant: transaction.merchant,

            amount: transaction.amount,

            category:
              transaction.category || "Unknown",

            cadence: "Monthly",

            action: protectedCategory
              ? "escalate"
              : wasteScore >= 70
              ? "cancel"
              : wasteScore >= 40
              ? "review"
              : "keep",

            waste_score: wasteScore,

            confidence_score: Math.min(
              95,
              70 + Math.floor(Math.random() * 20)
            ),

            protected: protectedCategory,

            guardrail: protectedCategory
              ? "Protected category requires review."
              : Number(transaction.amount) >
                Number(settings.autoActionLimit)
              ? "Amount exceeds automatic action limit."
              : "Within configured guardrail.",

            explanation: protectedCategory
              ? "This category is protected by your Guardian settings."
              : days >= 30
              ? `The subscription has not been used recently (${days} days since last detected use).`
              : "Recent usage signals suggest this subscription may still be useful.",

            potential_savings:
              wasteScore >= 70 &&
              !protectedCategory
                ? transaction.amount
                : 0,
          };
        });

      const potentialSavings =
        fallbackDecisions.reduce(
          (sum, item) =>
            sum +
            Number(
              item.potential_savings || 0
            ),
          0
        );

      setAuditResult({
        subscriptions_scanned:
          transactions.length,

        signals_found:
          fallbackDecisions.length,

        protected_count:
          fallbackDecisions.filter(
            (item) => item.protected
          ).length,

        potential_monthly_savings:
          potentialSavings,

        decisions: fallbackDecisions,
      });

      setDismissedDecisions([]);

      setActiveTab(targetTab);
    }
  };

  /* =======================================================
     CSV UPLOAD
     ======================================================= */

  const uploadCSV = async (file) => {
    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/transactions/csv",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "CSV upload failed"
        );
      }

      const data = await response.json();

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error(error);

      /*
       * Keep current transactions if backend upload
       * is unavailable.
       */
    }
  };

  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout = () => {
    localStorage.removeItem(
      "guardian_session"
    );

    localStorage.removeItem(
      "guardian_user_email"
    );

    setAuthenticated(false);
  };

  /* =======================================================
     AUTH SCREEN
     ======================================================= */

  if (!authenticated) {
    return (
      <AuthPage
        onLogin={() => setAuthenticated(true)}
      />
    );
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: "◈",
    },
    {
      id: "ai",
      label: "AI Audit",
      icon: "🤖",
      badge: auditResult
        ? auditResult.decisions?.length ||
          auditResult.results?.length ||
          0
        : 0,
    },
    {
      id: "insights",
      label: "AI Insights",
      icon: "✦",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: "▤",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  const protectedCategories =
    getProtectedCategories(
      settings.protectedCategories
    );

  return (
    <div className="app-shell">
      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            🛡️
          </div>

          <div>
            <div className="brand-title">
              Guardian
            </div>

            <div className="brand-subtitle">
              Recurring Spend AI
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${
                activeTab === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>

              {item.badge > 0 && (
                <span className="nav-badge">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="guardian-status">
            <span className="status-dot"></span>

            <div>
              <strong>Guardian Active</strong>

              <small>
                Monitoring recurring spend
              </small>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            ↪ Sign Out
          </button>
        </div>
      </aside>

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {activeTab === "dashboard"
                ? "Dashboard"
                : activeTab === "subscriptions"
                ? "Subscriptions"
                : activeTab === "ai"
                ? "AI Audit"
                : activeTab === "insights"
                ? "AI Insights"
                : activeTab === "transactions"
                ? "Transactions"
                : "Settings"}
            </h1>

            <p>
              Subscription & Recurring-Spend Guardian
            </p>
          </div>

          <div className="topbar-actions">
            {activeTab !== "settings" && (
              <button
                type="button"
                className="primary-button"
                onClick={() => runAudit("ai")}
              >
                🤖 Run Audit
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setActiveTab("settings")
              }
            >
              ⚙ Settings
            </button>
          </div>
        </header>

        {!backendAvailable && (
          <div className="message-banner">
            ⚠️ Backend is currently unavailable.
            Guardian is running in prototype/demo mode.
          </div>
        )}

        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        {activeTab === "dashboard" && (
          <DashboardPage
            subscriptions={subscriptions}
            transactions={transactions}
            protectedCategories={
              protectedCategories
            }
            onRunAudit={runAudit}
          />
        )}

        {activeTab === "subscriptions" && (
          <SubscriptionsPage
            subscriptions={subscriptions}
          />
        )}

        {activeTab === "ai" && (
          <AgentAIPage
            auditResult={auditResult}
            onRunAudit={runAudit}
            dismissedDecisions={
              dismissedDecisions
            }
            setDismissedDecisions={
              setDismissedDecisions
            }
            settings={settings}
          />
        )}

        {activeTab === "insights" && (
          <AIInsightsPage
            auditResult={auditResult}
            settings={settings}
            onRunAudit={runAudit}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsPage
            transactions={transactions}
            setTransactions={setTransactions}
            onUpload={uploadCSV}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPage
            settings={settings}
            setSettings={setSettings}
            settingsSection={
              settingsSection
            }
            setSettingsSection={
              setSettingsSection
            }
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   ROOT
   ========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);