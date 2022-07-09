import mongoose from "mongoose";
import express from "express";
import _ from "underscore";
import Joi from "joi";
import { bookModel, examplarModel, rentExemplarModel, userModel } from "./book_schema.js";
const app = express();
const port = 3000;
app.use(express.json());
mongoose.connect("mongodb://localhost:27017/Books");
/********************************************************************/
/************************BOOKS*********************************/
/************************************************/
//to see the Book list
app.get("/books", async (req, res) => {
  const queryInput = req.query;
  try {
    const allBooks = await bookModel.find(queryInput);
    const jsAllBooks = JSON.parse(JSON.stringify(allBooks));
    //to Join and filter the rent and exemplar Lists to have only "Active rent" Exemplar
    const joinedBooksList = await mongoose
      .model("rentExemplarModel")
      .aggregate([
        { $match: { rentActive: true } },
        { $lookup: { from: "examplarmodels", localField: "bookExemplarID", foreignField: "_id", as: "result" } },
      ]);

    //to calculate how many activ Exemplar in rent
    // count2: the number of the rented exemplars
    for (let index = 0; index < jsAllBooks.length; index++) {
      let element = jsAllBooks[index];
      let count2 = 0;
      joinedBooksList.forEach((element2) => {
        if (element._id == element2.result[0].book) {
          count2++;
        }
      });
      //to count how many Exemplar ready to rent
      //count : number of Exemplar in general
      let count = (await examplarModel.count({ book: element._id })) - count2;
      jsAllBooks[index].available = count;
    }
    res.status(200).send(jsAllBooks);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
/********************************************************************/
//to add a new book
app.post("/books", async (req, res) => {
  //to save the Input in a Schema Model
  const reqBodyInput = new bookModel({ ...req.body });
  try {
    //to search if the Book is already exists
    const findBook = await bookModel.find(req.body);
    if (findBook.length == 0) {
      await reqBodyInput.save();
      res.status(200).send("added successfully");
    } else {
      res.status(404).send("already added");
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/********************************************************************/
// to remove a Book
app.delete("/book/:id", async (req, res) => {
  try {
    // check if the Book has exemplars
    const findExemplar = await examplarModel.find({ book: req.params.id });
    if (findExemplar.length == 0) {
      // find and delete the Book
      let findBook = await bookModel.findByIdAndDelete(req.params.id);
      if (findBook == null) {
        res.status(404).send("ID not found");
      } else {
        res.status(200).send("deleted");
      }
    } else {
      res.status(404).send("the Book has Exemplar");
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/********************************************************************/
app.put("/book/:id", async (req, res) => {
  try {
    const bodyInput = req.body;
    //to check if the ID is valid
    const findID = await bookModel.findById(req.params.id);
    if (findID == null) {
      res.status(404).send("ID is invalid");
    } else {
      //join the inPut with the Target object
      let mergedObjects = JSON.parse(JSON.stringify(_.extend(findID, bodyInput)));
      delete mergedObjects._id; // to remove the ID
      // check if the mergedObject is already exists in the database
      let findObject = await bookModel.find(mergedObjects);
      if (findObject.length == 0) {
        await bookModel.updateOne({ _id: req.params.id }, { ...req.body });
        res.status(200).send("updatetd");
      } else {
        res.status(404).send("already exists");
      }
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/********************************************************************/
/********************************************************************/
/********************************************************************/
/**********************Exemplar**************************************/
// to add an Exemplar
app.post("/exemplar", async (req, res) => {
  try {
    const newSchemaExemplar = new examplarModel({ book: req.body.book });
    const findID = await bookModel.findById(req.body.book);
    if (findID == null) {
      res.status(404).send("ID is Invalid");
    } else {
      await newSchemaExemplar.save();
      res.send("the Exemplar has been added");
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/********************************************************************/
//to see the exemplar_list
app.get("/exemplar", async (req, res) => {
  let queryInput = req.query;
  try {
    const exemplarFind = await examplarModel.find(queryInput);
    res.status(200).send(exemplarFind);
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/************************************************************/
// //to remove Exemplar
app.delete("/exemplar/:id", async (req, res) => {
  try {
    // check if the ID valid
    const findID = await examplarModel.find({ _id: req.params.id });
    if (findID.length == 0) {
      res.status(404).send("Exempler ID not found");
    } else {
      // to check if the ID in the Rent list, and if the rent aktive to do the delete operation
      const findRentID = await rentExemplarModel.find({ bookExemplarID: req.params.id });

      if (findRentID.length == 0 || findRentID[0].rentActive == false) {
        await examplarModel.deleteOne({ _id: req.params.id });
        res.status(200).send("Exempler deleted");
      } else {
        res.status(404).send("rent Aktive");
      }
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/********************************************************************/
/*************************************RENT***************************/
/********************************************************************/
/********************************************************************/
//to add a new Rent
app.post("/rent", async (req, res) => {
  // to check if the ID and User ID valid
  //check if the Exempler is in Rent
  try {
    const findID = await examplarModel.findById(req.body.bookExemplarID);
    const isActive = await rentExemplarModel.find({ bookExemplarID: req.body.bookExemplarID, rentActive: true });
    const userID = await userModel.findById(req.body.userID);

    if (findID == null) {
      res.status(404).send("Exempler ID is invalid");
    } else if (null == userID) {
      res.status(404).send("User ID is not exist");
    } else if (isActive.length != 0) {
      res.status(404).send("Exempler is already in rent");
    } else {
      const rentExemplar = new rentExemplarModel({
        userID: req.body.userID,
        bookExemplarID: req.body.bookExemplarID,
        rentDate: new Date(),
        rentActive: true,
      });

      await rentExemplar.save();
      res.status(200).send("Rent Complete");
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/**********************************************************************/
//to see the Rent_list
app.get("/rent", async (req, res) => {
  try {
    const queryInput = req.query;
    const allRent = await rentExemplarModel.find(queryInput);
    res.status(200).send(allRent);
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/*********************************************************************/
//to end the Rent
app.post("/rent/end", async (req, res) => {
  const rentID = req.body.rentID;
  try {
    const findRentProfile = await rentExemplarModel.findOneAndUpdate({ _id: rentID, rentActive: true }, { rentActive: false });
    if (findRentProfile == null) {
      res.status(404).send("ID not found or RENT Inactive");
    } else {
      res.status(200).send("rent has been ended successfully");
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/********************************************************************/
/***********************USER*****************************************/
/********************************************************************/
/******************************/
//to add a new use
app.post("/user", async (req, res) => {
  const newSchemaUser = new userModel({ ...req.body });
  const valiSchema = Joi.object({
    name: Joi.string().alphanum(),
    email: Joi.string().email(),
  });
  const JoiError = valiSchema.validate(req.body);
  if (JoiError.error) {
    res.status(400).send(JoiError.error.details[0].message);
  } else {
    try {
      await newSchemaUser.save();
      res.send("the user has been created");
    } catch (error) {
      res.status(404).send(error.message);
    }
  }
});
/********************************************************************/
//to see the USER_list
app.get("/user", async (req, res) => {
  try {
    let queryInput = req.query;
    const allUsers = await userModel.find(queryInput);
    res.send(allUsers);
  } catch (error) {
    res.status(404).send(error.message);
  }
});
/******************/
//not vaild
app.use((req, res, next) => {
  res.status(404).send("Oida, wos du suchst is ned do");
});
/********************************************************************/
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
