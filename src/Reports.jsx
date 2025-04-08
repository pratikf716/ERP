import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import "./Reports.css";

const Reports = () => {
  const [invoiceData, setInvoiceData] = useState({
    paid: 0,
    pending: 0,
    totalAmount: 0,
    loading: true
  });

  const [leadsData, setLeadsData] = useState({
    count: 0,
    loading: true
  });

  const [customersData, setCustomersData] = useState({
    count: 0,
    loading: true
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Fetch invoices
    const invoicesRef = ref(db, "invoices");
    const unsubscribeInvoices = onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const invoices = Object.values(data);
        const paidInvoices = invoices.filter(
          (invoice) => invoice.status === "Paid"
        );
        const pendingInvoices = invoices.filter(
          (invoice) => invoice.status === "Pending"
        );

        let totalPaidAmount = 0;
        const monthlyData = Array(12)
          .fill(0)
          .map((_, index) => ({
            name: new Date(0, index).toLocaleString("en-US", {
              month: "short"
            }),
            payment: 0
          }));

        paidInvoices.forEach((invoice) => {
          const amount = parseFloat(invoice.total) || 0;
          totalPaidAmount += amount;

          const month = new Date(invoice.date).getMonth();
          monthlyData[month].payment += amount;
        });

        setInvoiceData({
          paid: paidInvoices.length,
          pending: pendingInvoices.length,
          totalAmount: totalPaidAmount,
          loading: false
        });

        setChartData(monthlyData);
      } else {
        setInvoiceData({
          paid: 0,
          pending: 0,
          totalAmount: 0,
          loading: false
        });
        setChartData([]);
      }
    });

    // Fetch leads
    const leadsRef = ref(db, "leads");
    const unsubscribeLeads = onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      setLeadsData({
        count: data ? Object.keys(data).length : 0,
        loading: false
      });
    });

    // Fetch customers
    const customersRef = ref(db, "customers");
    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      setCustomersData({
        count: data ? Object.keys(data).length : 0,
        loading: false
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeInvoices();
      unsubscribeLeads();
      unsubscribeCustomers();
    };
  }, []);

  return (
    <div className="main-container">
      <div className="report-container">
        {/* Summary Cards */}
        <div className="row mb-4">
          {[
            { title: "Paid Invoices", amount: invoiceData.paid, color: "success" },
            { title: "Pending Invoices", amount: invoiceData.pending, color: "danger" },
            { title: "Total Leads", amount: leadsData.count, color: "primary" },
            { title: "Total Clients", amount: customersData.count, color: "dark" }
          ].map((item, index) => (
            <div className="col-md-3" key={index}>
              <div className="card shadow text-center p-3">
                <h6 className="fw-bold">{item.title}</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <span
                    className={`badge bg-${item.color}`}
                    style={{ fontSize: "14px" }}
                  >
                    {item.amount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="card shadow p-4">
          <h5 className="fw-bold mb-3">Monthly Payments</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="payment" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3">
            <h6>
              Total Paid Invoice Amount:{" "}
              <span className="text-success">
                ₹{invoiceData.totalAmount.toFixed(2)}
              </span>
            </h6>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
