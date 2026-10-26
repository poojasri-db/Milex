const express = require("express");
const app = express();

app.use(express.json());

const sellerOnboarding = require("./seller_onboarding");
const customerregistration = require("./customer_registration");
const userLogin = require("./user_login");
const shippingprovider = require("./shipping_provider_management");
const offerdiscount = require("./offer_discount");
const products = require("./products");



app.use("/api/seller_onboarding", sellerOnboarding);
app.use("/api/customer_registration", customerregistration);
app.use("/api/user", userLogin);
app.use("/api/shipping_provider_management", shippingprovider);
app.use("/api/offer_discount", offerdiscount);
app.use("/api/products", products);


const PORT = 80;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});