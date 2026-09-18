import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = "";

const sampleSubscriptions = [
  {
    id: 1,
    name: "Netflix",
    category: "Entertainment",
    amount: 649,
    frequency: "Monthly",
    lastPayment: "2026-09-05",
    status: "Active",
    risk: "Low",
  },
  {
    id: 2,
    name: "Spotify",
    category: "Entertainment",
    amount: 119,
    frequency: "Monthly",
    lastPayment: "2026-09-03",
    status: "Active",
    risk: "Low",
  },
  {
    id: 3,
    name: "Gym Membership",
    category: "Fitness",
    amount: 1499,
    frequency: "Monthly",
    lastPayment: "2026-09-01",
    status: "Review",
    risk: "High",
  },
  {
    id: 4,
    name: "Cloud Storage",
    category: "Software",
    amount: 199,
    frequency: "Monthly",
    lastPayment: "2026-09-02",
    status: "Active",
    risk: "Low",
  },
  {
    id: 5,
    name: "Amazon Prime",
    category: "Shopping",
    amount: 299,
    frequency: "Monthly",
    lastPayment: "2026-09-04",
    status: "Active",
    risk: "Low",
  },
  {
    id: 6,
    name: "Adobe Creative Cloud",
    category: "Software",
    amount: 899,
    frequency: "Monthly",
    lastPayment: "2026-09-06",
    status: "Review",
    risk: "Medium",
  },
];

const sampleTransactions = [
  {
    id: 1,
    merchant: "Netflix",
    amount: 649,
    date: "2026-07-05",
    description: "Netflix subscription",
    category: "Entertainment",
  },
  {
    id: 2,
    merchant: "Spotify",
    amount: 119,
    date: "2026-07-03",
    description: "Spotify subscription",
    category: "Entertainment",
  },
  {
    id: 3,
    merchant: "Gym Membership",
    amount: 1499,
    date: "2026-07-01",
    description: "Monthly gym membership",
    category: "Fitness",
  },
  {
    id: 4,
    merchant: "Cloud Storage",
    amount: 199,
    date: "2026-07-02",
    description: "Cloud storage plan",
    category: "Software",
  },
  {
    id: 5,
    merchant: "Amazon Prime",
    amount: 299,
    date: "2026-07-04",
    description: "Amazon Prime subscription",
    category: "Shopping",
  },
  {
    id: 6,
    merchant: "Adobe Creative Cloud",
    amount: 899,
    date: "2026-07-06",
    description: "Adobe Creative Cloud",
    category: "Software",
  },
  {
    id: 7,
    merchant: "Netflix",
    amount: 649,
    date: "2026-08-05",
    description: "Netflix subscription",
    category: "Entertainment",
  },
  {
    id: 8,
    merchant: "Spotify",
    amount: 119,
    date: "2026-08-03",
    description: "Spotify subscription",
    category: "Entertainment",
  },
  {
    id: 9,
    merchant: "Gym Membership",
    amount: 1499,
    date: "2026-08-01",
    description: "Monthly gym membership",
    category: "Fitness",
  },
  {
    id: 10,
    merchant: "Cloud Storage",
    amount: 199,
    date: "2026-08-02",
    description: "Cloud storage plan",
    category: "Software",
  },
  {
    id: 11,
    merchant: "Amazon Prime",
    amount: 299,
    date: "2026-08-04",
    description: "Amazon Prime subscription",
    category: "Shopping",
  },
  {
    id: 12,
    merchant: "Adobe Creative Cloud",
    amount: 899,
    date: "2026-08-06",
    description: "Adobe Creative Cloud",
    category: "Software",
  },
  {
    id: 13,
    merchant: "Netflix",
    amount: 649,
    date: "2026-09-05",
    description: "Netflix subscription",
    category: "Entertainment",
  },
  {
    id: 14,
    merchant: "Spotify",
    amount: 119,
    date: "2026-09-03",
    description: "Spotify subscription",
    category: "Entertainment",
  },
  {
    id: 15,
    merchant: "Gym Membership",
    amount: 1499,
    date: "2026-09-01",
    description: "Monthly gym membership",
    category: "Fitness",
  },
  {
    id: 16,
    merchant: "Cloud Storage",
    amount: 199,
    date: "2026-09-02",
    description: "Cloud storage plan",
    category: "Software",
  },
  {
    id: 17,
    merchant: "Amazon Prime",
    amount: 299,
    date: "2026-09-04",
    description: "Amazon Prime subscription",
    category: "Shopping",
  },
  {
    id: 18,
    merchant: "Adobe Creative Cloud",
    amount: 899,
    date: "2026-09-06",
    description: "Adobe Creative Cloud",
    category: "Software",
  },
];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("");
  const [auditResult, setAuditResult] = useState(null);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const [stats, setStats] = useState({
    monthlySpend: 0,
    yearlySpend: 0,
    subscriptionCount: 0,
    potentialSavings: 0,
  });

  useEffect(() => {
    setSubscriptions(sampleSubscriptions);
    setTransactions(sampleTransactions);

    const monthly = sampleSubscriptions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    setStats({
      monthlySpend: monthly,
      yearlySpend: monthly * 12,
      subscriptionCount: sampleSubscriptions.length,
      potentialSavings: 0,
    });
  }, []);

  useEffect(() => {
    const monthly = subscriptions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    setStats((previous) => ({
      ...previous,
      monthlySpend: monthly,
      yearlySpend: monthly * 12,
      subscriptionCount: subscriptions.length,
    }));
  }, [subscriptions]);

  async function checkBackend() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();

      setBackendStatus(
        data.ok
          ? "Backend connected"
          : "Backend connection failed"
      );
    } catch (error) {
      setBackendStatus("Backend not connected");
    }
  }

  async function uploadTransactionFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingFile(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/api/transactions/csv`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to upload transaction file"
        );
      }

      const uploadedTransactions = (data.transactions || []).map(
        (transaction, index) => ({
          ...transaction,
          id:
            transaction.id ||
            `uploaded-${Date.now()}-${index}`,
          amount: Number(transaction.amount || 0),
        })
      );

      setTransactions(uploadedTransactions);
      setUploadedFileName(file.name);
      setActiveTab("transactions");

      setMessage(
        `${data.count} transaction(s) loaded successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        `Upload failed: ${
          error.message || "Unable to process file."
        }`
      );
    } finally {
      setUploadingFile(false);

      // Allows selecting the same file again.
      event.target.value = "";
    }
  }

  function dismissUploadedFile() {
    setUploadedFileName("");
    setTransactions(sampleTransactions);
    setMessage("Uploaded transaction file dismissed.");
  }

  async function runAudit() {
    setLoading(true);
    setMessage("");
    setAuditResult(null);

    try {
      const charges = subscriptions
        .filter((subscription) => subscription.status === "Active")
        .map((subscription) => ({
          merchant: subscription.name,
          amount: Number(subscription.amount),
          date: subscription.lastPayment,
          description: `${subscription.name} subscription`,
          category: subscription.category,
        }));

      const response = await fetch(`${API_BASE}/api/audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          charges,
          emails: [],
          auto_action_limit: 500,
          protected_categories: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Audit failed"
        );
      }

      setAuditResult(data);

      setStats((previous) => ({
        ...previous,
        potentialSavings: Number(
          data.estimated_monthly_savings || 0
        ),
      }));

      setActiveTab("insights");

      setMessage("Subscription audit completed successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        `Audit failed: ${
          error.message || "Unable to run audit."
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  function removeSubscription(id) {
    setSubscriptions((current) =>
      current.filter((item) => item.id !== id)
    );

    setMessage("Subscription removed.");
  }

  function markForReview(id) {
    setSubscriptions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Review",
            }
          : item
      )
    );

    setMessage("Subscription marked for review.");
  }

  const calculatedMonthly = useMemo(() => {
    return subscriptions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [subscriptions]);

  const calculatedYearly = calculatedMonthly * 12;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">SG</div>

          <div>
            <h1>Subscription Guardian</h1>
            <p>AI-powered recurring spend protection</p>
          </div>
        </div>

        <div className="topbar-actions">
          {backendStatus && (
            <span className="backend-status">
              {backendStatus}
            </span>
          )}

          <button
            className="secondary-btn"
            onClick={checkBackend}
          >
            Check Backend
          </button>

          <button
            className="primary-btn"
            onClick={runAudit}
            disabled={loading}
          >
            {loading ? "Auditing..." : "Run Subscription Audit"}
          </button>
        </div>
      </header>

      <nav className="navigation">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={
            activeTab === "subscriptions" ? "active" : ""
          }
          onClick={() => setActiveTab("subscriptions")}
        >
          Subscriptions
        </button>

        <button
          className={
            activeTab === "insights" ? "active" : ""
          }
          onClick={() => setActiveTab("insights")}
        >
          AI Insights
        </button>

        <button
          className={
            activeTab === "transactions" ? "active" : ""
          }
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
      </nav>

      <main className="main-content">
        {message && (
          <div className="message-box">
            {message}
          </div>
        )}

        {activeTab === "dashboard" && (
          <Dashboard
            subscriptions={subscriptions}
            stats={{
              ...stats,
              monthlySpend: calculatedMonthly,
              yearlySpend: calculatedYearly,
            }}
            onRemove={removeSubscription}
            onReview={markForReview}
            onAudit={runAudit}
            loading={loading}
          />
        )}

        {activeTab === "subscriptions" && (
          <SubscriptionsPage
            subscriptions={subscriptions}
            onRemove={removeSubscription}
            onReview={markForReview}
          />
        )}

        {activeTab === "insights" && (
          <InsightsPage
            auditResult={auditResult}
            subscriptions={subscriptions}
            stats={stats}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsPage
            transactions={transactions}
            uploadingFile={uploadingFile}
            uploadedFileName={uploadedFileName}
            uploadTransactionFile={uploadTransactionFile}
            dismissUploadedFile={dismissUploadedFile}
          />
        )}
      </main>
    </div>
  );
}

function Dashboard({
  subscriptions,
  stats,
  onRemove,
  onReview,
  onAudit,
  loading,
}) {
  const activeSubscriptions = subscriptions.filter(
    (item) => item.status === "Active"
  );

  return (
    <>
      <section className="hero-section">
        <div>
          <span className="eyebrow">
            FINANCIAL PROTECTION
          </span>

          <h2>
            Find the money you're quietly
            <br />
            leaking every month.
          </h2>

          <p>
            Subscription Guardian analyzes your recurring
            spending and identifies subscriptions that may
            need attention.
          </p>
        </div>

        <button
          className="primary-btn large"
          onClick={onAudit}
          disabled={loading}
        >
          {loading ? "Running Audit..." : "Run AI Audit"}
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Monthly Spend"
          value={`₹${stats.monthlySpend.toLocaleString("en-IN")}`}
          subtitle="Recurring monthly cost"
        />

        <StatCard
          title="Yearly Spend"
          value={`₹${stats.yearlySpend.toLocaleString("en-IN")}`}
          subtitle="Projected annual cost"
        />

        <StatCard
          title="Subscriptions"
          value={stats.subscriptionCount}
          subtitle="Tracked recurring services"
        />

        <StatCard
          title="Potential Savings"
          value={`₹${Number(
            stats.potentialSavings || 0
          ).toLocaleString("en-IN")}`}
          subtitle="Estimated monthly savings"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Active Subscriptions</h3>
            <p>
              Services currently being tracked by Guardian.
            </p>
          </div>

          <span className="count-badge">
            {activeSubscriptions.length}
          </span>
        </div>

        <SubscriptionTable
          subscriptions={activeSubscriptions.slice(0, 5)}
          onRemove={onRemove}
          onReview={onReview}
        />
      </section>
    </>
  );
}

function SubscriptionsPage({
  subscriptions,
  onRemove,
  onReview,
}) {
  const activeSubscriptions = subscriptions.filter(
    (item) => item.status === "Active"
  );

  return (
    <section>
      <div className="page-heading">
        <span className="eyebrow">
          SUBSCRIPTION MANAGEMENT
        </span>

        <h2>Your Subscriptions</h2>

        <p>
          Review and manage the recurring services detected
          by Subscription Guardian.
        </p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Active Subscriptions</h3>
            <p>
              Your currently active recurring services.
            </p>
          </div>

          <span className="count-badge">
            {activeSubscriptions.length}
          </span>
        </div>

        <SubscriptionTable
          subscriptions={activeSubscriptions}
          onRemove={onRemove}
          onReview={onReview}
        />
      </section>
    </section>
  );
}

function SubscriptionTable({
  subscriptions,
  onRemove,
  onReview,
}) {
  if (subscriptions.length === 0) {
    return (
      <div className="empty-state">
        <h3>No active subscriptions</h3>
        <p>
          Guardian did not find any active subscriptions
          to display.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Frequency</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>
                <strong>{subscription.name}</strong>
                <small>
                  Last payment:{" "}
                  {subscription.lastPayment}
                </small>
              </td>

              <td>{subscription.category}</td>

              <td>
                <strong>
                  ₹
                  {Number(
                    subscription.amount
                  ).toLocaleString("en-IN")}
                </strong>
              </td>

              <td>{subscription.frequency}</td>

              <td>
                <span
                  className={`status-pill ${subscription.status.toLowerCase()}`}
                >
                  {subscription.status}
                </span>
              </td>

              <td>
                <span
                  className={`risk-pill ${subscription.risk.toLowerCase()}`}
                >
                  {subscription.risk}
                </span>
              </td>

              <td>
                <div className="action-buttons">
                  <button
                    className="small-btn"
                    onClick={() =>
                      onReview(subscription.id)
                    }
                  >
                    Review
                  </button>

                  <button
                    className="small-btn danger"
                    onClick={() =>
                      onRemove(subscription.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightsPage({
  auditResult,
  subscriptions,
  stats,
}) {
  if (!auditResult) {
    return (
      <section>
        <div className="page-heading">
          <span className="eyebrow">
            AI ANALYSIS
          </span>

          <h2>AI Insights</h2>

          <p>
            Run the Subscription Audit to generate
            Guardian's analysis.
          </p>
        </div>

        <div className="insight-placeholder">
          <div className="insight-icon">AI</div>

          <h3>No audit has been run yet</h3>

          <p>
            Click "Run Subscription Audit" to analyze
            your recurring subscriptions.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <span className="eyebrow">
          AI ANALYSIS COMPLETE
        </span>

        <h2>AI Insights</h2>

        <p>
          Guardian has analyzed your recurring spending.
        </p>
      </div>

      <section className="insight-summary-grid">
        <LargeInsight
          title="Potential Monthly Savings"
          value={`₹${Number(
            auditResult.estimated_monthly_savings || 0
          ).toLocaleString("en-IN")}`}
          description="Estimated recurring savings identified by the audit."
        />

        <LargeInsight
          title="Recurring Charges"
          value={auditResult.recurring_count ?? subscriptions.length}
          description="Recurring charges analyzed by Guardian."
        />

        <LargeInsight
          title="Tracked Monthly Spend"
          value={`₹${Number(
            stats.monthlySpend || 0
          ).toLocaleString("en-IN")}`}
          description="Current recurring monthly spending."
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Guardian Summary</h3>
            <p>
              Overall analysis of your recurring spending.
            </p>
          </div>
        </div>

        <div className="summary-text">
          {auditResult.summary || "No summary available."}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>AI Decisions</h3>
            <p>
              Recommended actions generated by Guardian.
            </p>
          </div>
        </div>

        {auditResult.decisions?.length ? (
          <div className="decision-list">
            {auditResult.decisions.map(
              (decision, index) => (
                <DecisionCard
                  key={`${decision.merchant}-${index}`}
                  decision={decision}
                />
              )
            )}
          </div>
        ) : (
          <div className="empty-state">
            No decisions were generated.
          </div>
        )}
      </section>

      {auditResult.email_findings?.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Email Findings</h3>
              <p>
                Subscription-related information found
                in email data.
              </p>
            </div>
          </div>

          <div className="email-findings">
            {auditResult.email_findings.map(
              (finding, index) => (
                <Insight
                  key={index}
                  title={
                    finding.merchant ||
                    finding.subject ||
                    "Email Finding"
                  }
                  text={
                    finding.message ||
                    finding.description ||
                    "Subscription-related email detected."
                  }
                />
              )
            )}
          </div>
        </section>
      )}
    </section>
  );
}

function DecisionCard({ decision }) {
  const action = String(
    decision.action || "keep"
  ).toLowerCase();

  return (
    <div className={`decision-card ${action}`}>
      <div className="decision-top">
        <div>
          <h4>
            {decision.merchant || "Unknown Merchant"}
          </h4>

          <p>
            ₹
            {Number(
              decision.amount || 0
            ).toLocaleString("en-IN")}
            {" "}
            recurring charge
          </p>
        </div>

        <span className="decision-action">
          {decision.action || "keep"}
        </span>
      </div>

      {decision.reason && (
        <p className="decision-reason">
          {decision.reason}
        </p>
      )}
    </div>
  );
}

function TransactionsPage({
  transactions,
  uploadingFile,
  uploadedFileName,
  uploadTransactionFile,
  dismissUploadedFile,
}) {
  return (
    <section>
      <div className="page-heading">
        <span className="eyebrow">
          TRANSACTION DATA
        </span>

        <h2>Transactions</h2>

        <p>
          Upload your transaction CSV to test
          Subscription Guardian.
        </p>
      </div>

      {/* UPDATED UPLOADED-FILE SECTION */}
      <div className="panel transaction-upload-panel">
        <div className="panel-header">
          <div>
            <h3>Upload Transaction File</h3>

            <p>
              Upload a CSV file containing your bank
              transactions to test Guardian.
            </p>
          </div>

          <label className="upload-btn">
            {uploadingFile
              ? "Processing..."
              : "Choose CSV File"}

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={uploadTransactionFile}
              disabled={uploadingFile}
              hidden
            />
          </label>
        </div>

        {uploadedFileName && (
          <div className="uploaded-file-info">
            <span className="uploaded-file-check">
              ✓
            </span>

            <div>
              <strong>{uploadedFileName}</strong>

              <small>
                {transactions.length} transaction(s)
                loaded
              </small>
            </div>

            <button
              className="dismiss-file-btn"
              type="button"
              onClick={dismissUploadedFile}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Transaction History</h3>

            <p>
              {transactions.length} transaction(s)
              currently loaded.
            </p>
          </div>

          <span className="count-badge">
            {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions loaded</h3>

            <p>
              Upload a CSV file to load transaction data.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>
                        {transaction.merchant}
                      </strong>
                    </td>

                    <td>
                      ₹
                      {Number(
                        transaction.amount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>{transaction.date}</td>

                    <td>
                      {transaction.description || "-"}
                    </td>

                    <td>
                      {transaction.category || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>

      <strong className="stat-value">{value}</strong>

      <span className="stat-subtitle">
        {subtitle}
      </span>
    </div>
  );
}

function LargeInsight({
  title,
  value,
  description,
}) {
  return (
    <div className="large-insight">
      <span>{title}</span>

      <strong>{value}</strong>

      <p>{description}</p>
    </div>
  );
}

function Insight({ title, text }) {
  return (
    <div className="insight-card">
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);