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
const brand = require("./brand");
const taxrate = require("./tax_rate");
const subcategory = require("./sub_category");


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
app.use("/api/brand", brand);
app.use("/api/tax_rate", taxrate);
app.use("/api/sub_category", subcategory);

 

const PORT = 80;

app.listen(PORT, () => {
    console.log(`Server running`);
});  


 