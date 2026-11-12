require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json());

const sellerOnboarding = require("./seller_onboarding");
const customerregistration = require("./customer_registration");
const userLogin = require("./user_login");
const shippingprovider = require("./shipping_provider_management");
const offerdiscount = require("./offer_discount");
const products = require("./products");
const ordermanagement = require("./order_management");
const productvariant = require("./product_variant");
const state = require("./state");
const country = require("./country");
const businesstype = require("./business_type");
const sellerverification = require("./seller_verification");
const sellerdocs = require("./seller_docs");
const sellerbankdetails = require("./seller_bank_details");
const bankaccounttype = require("./bank_account_type");
const status = require("./status");
const categorymanagement = require("./category_management");
const category = require("./category");
const brandmanagement = require("./brand_management");
const taxrate = require("./tax_rate");
const subcategory = require("./sub_category");
const productcode = require("./product_code");
const documentverification = require("./document_verification");
const sellerapprovereject = require("./seller_approve_reject");
const colours = require("./colours");
const sizes = require("./sizes");
const materials = require("./materials");
const sellerdashboard = require("./seller_dashboard");
const datefilter = require("./date_filter");
const orderdashboard = require("./order_dashboard");
const allstatus = require("./all_status");
const paymentstatus = require("./payment_status");
const shippingstatus = require("./shipping_status");
const ordercount = require("./order_count");
const customeraddress = require("./customer_address");
const returnrequest = require("./return_request");
const returncount = require("./return_count");
const returnreason = require("./return_reason");



app.use("/api/seller_onboarding", sellerOnboarding);
app.use("/api/customer_registration", customerregistration);
app.use("/api/user", userLogin);
app.use("/api/shipping_provider_management", shippingprovider);
app.use("/api/offer_discount", offerdiscount);
app.use("/api/products", products);
app.use("/api/order_management", ordermanagement);
app.use("/api/product_variant", productvariant);
app.use("/api/state", state);
app.use("/api/country", country);
app.use("/api/business_type", businesstype);
app.use("/api/seller_verification", sellerverification);
app.use("/api/seller_docs", sellerdocs);
app.use("/api/seller_bank_details", sellerbankdetails);
app.use("/api/bank_account_type", bankaccounttype);
app.use("/api/status", status);
app.use("/api/category_management", categorymanagement);
app.use("/api/category", category);
app.use("/api/brand_management", brandmanagement);
app.use("/api/tax_rate", taxrate);
app.use("/api/sub_category", subcategory);
app.use("/api/product_code", productcode);
app.use("/api/document_verification", documentverification);
app.use("/api/seller_approve_reject", sellerapprovereject);
app.use("/api/colours", colours);
app.use("/api/sizes", sizes);
app.use("/api/materials", materials);
app.use("/api/seller_dashboard", sellerdashboard);
app.use("/api/date_filter", datefilter);
app.use("/api/order_dashboard", orderdashboard);
app.use("/api/all_status", allstatus);
app.use("/api/payment_status", paymentstatus);
app.use("/api/shipping_status", shippingstatus);
app.use("/api/order_count", ordercount);
app.use("/api/colours", colours);
app.use("/api/customer_address", customeraddress);
app.use("/api/return_request", returnrequest);
app.use("/api/return_count", returncount);
app.use("/api/return_reason", returnreason);

 

const PORT = 80;

app.listen(PORT, () => {
    console.log(`Server running`);
});  


 