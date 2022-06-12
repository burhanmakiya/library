import express from "express";
import mongoose from "mongoose";
import {
  bookModel,
  examplarModel,
  rentExemplarModel,
  userModel,
} from "./book_schema.js";
const app = express();
const port = 3000;
app.use(express.json());
mongoose.connect("mongodb://localhost:27017/Books");
/********************************************************************/
/************************BOOKS*********************************/
/********************************************************************/
/************************************************/
//to see the Book list
app.get("/books", async (req, res) => {
  const queryInput = req.query;
  const allBooks = await bookModel.find(queryInput);
  const jsAllBooks = JSON.parse(JSON.stringify(allBooks));
  //to Join and filter the rent and exemplar Lists to have only "Active rent" Exemplar
  const joinedBooksList = await mongoose.model("rentExemplarModel").aggregate([
    { $match: { rentActive: true } },
    {
      $lookup: {
        from: "examplarmodels",
        localField: "bookExemplarID",
        foreignField: "_id",
        as: "result",
      },
    },
  ]);
  //to calculate how many activ Exemplar in rent
  // count2: is the number of the rented exemplar
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
  res.send(jsAllBooks);
});
/********************************************************************/
//to add a new book
app.post("/books", async (req, res) => {
  const newSchemaBook = new bookModel({
    author: req.body.author,
    releaseDate: req.body.releaseDate,
    title: req.body.title,
    numberOfPages: req.body.numberOfPages,
  });
  //to check if the inPut already exists
  const isAlreadyAdded = await bookModel.find({
    author: newSchemaBook.author,
    releaseDate: newSchemaBook.releaseDate,
    title: newSchemaBook.title,
    numberOfPages: newSchemaBook.numberOfPages,
  });
  if (Object.keys(isAlreadyAdded).length === 0) {
    newSchemaBook.save();
    res.send("The book has been successfully added");
  } else {
    res.send("Unfortunately, the book has already been added");
  }
});
/********************************************************************/
// to remove a Book
app.delete("/book/:id", async function (req, res) {
  const deletedElemet = await bookModel.findByIdAndDelete(req.params.id);
  if (deletedElemet == null) {
    res.status(404).send("the ID invalid");
  } else {
    res.status(200).send("Deleted");
  }
});
/********************************************************************/
//to edit a book
app.put("/book/:id", function (req, res) {
  const bodyInput = req.body;
  //to check if the ID is valid
  bookModel.findById(req.params.id, function (error, checker) {
    if (error) {
      res.status(404).send("the ID is not valid");
    } else {
      //to join the req.body with the founded object
      const mergedObjects = Object.assign(checker, bodyInput);
      //to check if the Joined object is already exists
      // if exists the Update will be canceld
      bookModel.find(mergedObjects, "-_id").then(function (result) {
        if (result.length == 0) {
          bookModel
            .updateOne({ _id: req.params.id }, { ...req.body })
            .then(function (result) {
              res.status(202).send("Updated");
            });
        } else {
          res.status(404).send("already exists");
        }
      });
    }
  });
});
/********************************************************************/
/********************************************************************/
/********************************************************************/
/**********************Exemplar**************************************/
// to add an Exemplar
app.post("/exemplar", async (req, res) => {
  const newSchemaExemplar = new examplarModel({
    book: req.body.book,
  });
  newSchemaExemplar.save();
  res.send("the Exemplar has been successfully added");
});
/********************************************************************/
//to see the exemplar_list
app.get("/exemplar", async (req, res) => {
  let queryInput = req.query;
  const allExemplar = await examplarModel.find(queryInput);
  res.send(allExemplar);
});
/********************************************************************/
/*************************************RENT***************************/
/********************************************************************/
/********************************************************************/
//to add a new Rent
app.post("/rent", async (req, res) => {
  const rentExemplar = new rentExemplarModel({
    userID: req.headers["userid"],
    bookExemplarID: req.body.bookExemplarID,
    rentDate: new Date(),
    rentActive: true,
  });
  await examplarModel.updateOne(
    { _id: req.body.bookExemplarID },
    { rentActive: true }
  );

  rentExemplar.save();
  res.send("Thank you for renting");
});
/**********************************************************************/
//to see the Rent_list
app.get("/rent", async (req, res) => {
  let queryInput = req.query;
  const allRent = await rentExemplarModel.find(queryInput);
  res.send(allRent);
});
/*********************************************************************/
//to end the Rent
app.post("/rent/end", async (req, res) => {
  const rendID = { RendtID: req.body.RentID }.RendtID;
  const rendProfile = await rentExemplarModel.find({ _id: rendID });

  rentExemplarModel.updateOne({ _id: rendID }, { rentActive: false }).then(
    () =>
      examplarModel
        .updateOne(
          { _id: rendProfile[0].bookExemplarID },
          { rentActive: false }
        )

        .then(
          () => {
            res.send("the rent has been ended successfully");
          },
          () => {
            res.send("the rent has not ended in the Exemplar");
          }
        ),
    () => {
      res.send("the rent has not ended in the rent profile");
    }
  );
});
/********************************************************************/
/***********************USER*****************************************/
/********************************************************************/
/******************************/
//to add a new use
app.post("/user", async (req, res) => {
  const newSchemaUser = new userModel({
    ...req.body,
  });
  newSchemaUser.save();
  res.send("the user has been created");
});
/********************************************************************/
//to see the USER_list
app.get("/user", async (req, res) => {
  let queryInput = req.query;
  const allUsers = await userModel.find(queryInput);
  res.send(allUsers);
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
