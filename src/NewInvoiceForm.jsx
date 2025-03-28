import React, { useState, useEffect, useRef } from "react";
import { ref, push, set, get } from "firebase/database";
import { db } from "./firebase";
import Swal from "sweetalert2";
import "./NewInvoiceForm.css";

const NewInvoiceForm = ({ onSave, onClose, customers = [] }) => {
  const today = new Date().toISOString().split("T")[0];

  const [invoice, setInvoice] = useState({
    number: "",
    clientId: "",
    companyId: "",
    productIds: [],
    personId: "",
    date: today,
    expireDate: today,
    total: "",
    status: "Draft",
    createdBy: "",
  });

  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [people, setPeople] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await get(ref(db, "products"));
        if (snapshot.exists()) {
          const productData = snapshot.val();
          setProducts(Object.keys(productData).map((key) => ({ id: key, name: productData[key].name })));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const snapshot = await get(ref(db, "companies"));
        if (snapshot.exists()) {
          const companyData = snapshot.val();
          setCompanies(Object.keys(companyData).map((key) => ({ id: key, name: companyData[key].name })));
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const snapshot = await get(ref(db, "people"));
        if (snapshot.exists()) {
          const peopleData = snapshot.val();
          setPeople(Object.keys(peopleData).map((key) => ({ id: key, name: peopleData[key].name })));
        }
      } catch (error) {
        console.error("Error fetching people:", error);
      }
    };
    fetchPeople();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    setInvoice({ ...invoice, [e.target.name]: e.target.value });
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleProductSelection = (productId) => {
    setInvoice((prevInvoice) => {
      const updatedProducts = prevInvoice.productIds.includes(productId)
        ? prevInvoice.productIds.filter((id) => id !== productId)
        : [...prevInvoice.productIds, productId];
      return { ...prevInvoice, productIds: updatedProducts };
    });
  };

  const handleSave = () => {
    if (
      !invoice.number.trim() ||
      !invoice.clientId.trim() ||
      !invoice.companyId.trim() ||
      invoice.productIds.length === 0 ||
      !invoice.personId.trim() ||
      !invoice.date.trim() ||
      !invoice.expireDate.trim() ||
      !invoice.total.trim() ||
      !invoice.createdBy.trim()
    ) {
      Swal.fire("Error!", "All fields are required!", "error");
      return;
    }

    const totalValue = parseFloat(invoice.total);
    if (isNaN(totalValue) || totalValue <= 0) {
      Swal.fire("Error!", "Total must be a valid number!", "error");
      return;
    }

    const newInvoiceRef = push(ref(db, "invoices"));
    set(newInvoiceRef, { ...invoice, total: totalValue })
      .then(() => {
        Swal.fire("Success!", "Invoice added successfully!", "success");
        onSave();
        onClose();
      })
      .catch((error) => {
        Swal.fire("Error!", "Failed to add invoice. Try again.", "error");
        console.error("Firebase Error:", error);
      });
  };

  return (
    <div className="invoice-form">
      <h2>New Invoice</h2>
      <div className="form-section">
        <label>Number *</label>
        <input type="text" name="number" value={invoice.number} onChange={handleChange} />

        <label>Client *</label>
        <select name="clientId" value={invoice.clientId} onChange={handleChange}>
          <option value="">Select Client</option>
          {customers.map((customer) => (
            <option key={customer.value} value={customer.value}>{customer.label || "Unnamed Client"}</option>
          ))}
        </select>

        <label>Company *</label>
        <select name="companyId" value={invoice.companyId} onChange={handleChange}>
          <option value="">Select Company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>

        <label>Products *</label>
        <div className="dropdown" ref={dropdownRef}>
          <button type="button" className="dropdown-toggle" onClick={toggleDropdown}>
            {invoice.productIds.length > 0 ? `${invoice.productIds.length} selected` : "Select Products"}
          </button>
          <div className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
            {products.map((product) => (
              <label key={product.id} className="dropdown-item">
                <input
                  type="checkbox"
                  checked={invoice.productIds.includes(product.id)}
                  onChange={() => handleProductSelection(product.id)}
                />
                {product.name}
              </label>
            ))}
          </div>
        </div>

        <label>Person *</label>
        <select name="personId" value={invoice.personId} onChange={handleChange}>
          <option value="">Select Person</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>

        <label>Date *</label>
        <input type="date" name="date" value={invoice.date} onChange={handleChange} />

        <label>Expire Date *</label>
        <input type="date" name="expireDate" value={invoice.expireDate} onChange={handleChange} />

        <label>Total *</label>
        <input type="text" name="total" value={invoice.total} onChange={handleChange} />

        <label>Status *</label>
        <select name="status" value={invoice.status} onChange={handleChange}>
          <option value="Draft">Draft</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>

        <label>Created By *</label>
        <input type="text" name="createdBy" value={invoice.createdBy} onChange={handleChange} />
      </div>

      <button onClick={handleSave}>Save Invoice</button>
    </div>
  );
};

export default NewInvoiceForm;
