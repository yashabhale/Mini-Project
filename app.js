const express = require('express');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const path = require('path');
const Listing= require("./models/listing.js");
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");

app.use(methodOverride('_method'));
const MONGO_URL ='mongodb://127.0.0.1:27017/wanderlust';

main()
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch((err) =>{
    console.log("Error connecting to MongoDB:", err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, '/public')));


app.get('/', (req, res) => {
  res.send('Hello i am root !');
});

//new route
app.get("/listings/new",(req,res)=>{
  res.render("listings/new.ejs");
});

const validateListing = (req,res,next) =>{
  let {error} = listingSchema.validate(req.body);
  
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400,errMsg);
  } else{
    next();
  }
};

//show route
app.get("/listings/:id", wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs",{listing});
}));



//Index route for listings
app.get ("/listings", wrapAsync(async(req,res ,next)=>{
 const allListings = await Listing.find({});
 
 res.render("listings/index.ejs",{allListings});
}));

//Create route for listings
app.post("/listings",validateListing, wrapAsync(async(req,res,next)=>{
  let result = listingSchema.validate(req.body);
  
  if(result.error){
    
    throw new ExpressError(400,result.error);
  }
const listingData = req.body.listing;
  if (listingData.image && typeof listingData.image === 'string') {
    listingData.image = { url: listingData.image };
  }
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect(`/listings`);
  
}));

//delete route for listings
app.post("/listings/:id/delete", wrapAsync(async(req,res,next)=>{
  const {id} = req.params;
  await Listing.findByIdAndDelete(id);
  
  res.redirect("/listings");
}));

//edit route for listings
app.get("/listings/:id/edit",validateListing, wrapAsync(async(req,res)=>{
  const {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs",{listing});
}));


//update route for listings
app.put("/listings/:id", wrapAsync(async(req,res)=>{
  const {id} = req.params;
  const listingData = req.body.listing;
  if (listingData.image && typeof listingData.image === 'string') {
    listingData.image = { url: listingData.image };
  }
  const listing = await Listing.findByIdAndUpdate(id, listingData,{runValidators:true,new:true});
  res.redirect(`/listings/${listing._id}`);
}));
// app.get("/testListing", async(req,res)=>{
//   let sampleListing =new Listing ({
//     title:"My new villa",
//     description: "By the beach",
//     price:1200,
//     location:"Goa",
//     country: "India",
//   });
//    await sampleListing.save();
//    console.log("Sample saved");
//    res.send("Successful testing")
// })
 
app.use((req,res,next) => {
  next(new ExpressError(404, "Page not found !"));
});

app.use((err,req,res,next)=>{
  let{statusCode="500" ,message="Something went rong"}=err;
  res.render("error.ejs",{statusCode,message});
 // res.status(statusCode).send(message);
  
});

app.listen(port, () => {
  console.log(`Example app listening ${port}`);
});