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
  const joinedBooksList = await mongoose.model("examplarModel").aggregate([
    {
      $lookup: {
        from: "rentexemplarmodels",
        localField: "_id",
        foreignField: "bookExemplarID",
        as: "result",
      },
    },
  ]);

  for (let index = 0; index < jsAllBooks.length; index++) {
    let element = jsAllBooks[index];
    if (joinedBooksList[index].result.length == 1) {
      if (joinedBooksList[index].result[0].rentActive == true) {
        let count = await examplarModel.count({ book: element._id });
        jsAllBooks[index].available = count - 1;
      } else {
        let count = await examplarModel.count({ book: element._id });
        jsAllBooks[index].available = count;
      }
    } else {
      let count = await examplarModel.count({ book: element._id });
      jsAllBooks[index].available = count;
    }
  }

  res.send(jsAllBooks);
  // const queryInput = req.query;
  // const allBooks = await bookModel.find(queryInput);
  // const jsAllBooks = JSON.parse(JSON.stringify(allBooks));
  // const joinedBooksList = await mongoose.model("examplarModel").aggregate([
  //   {
  //     $lookup: {
  //       from: "rentexemplarmodels",
  //       localField: "_id",
  //       foreignField: "bookExemplarID",
  //       as: "result",
  //     },
  //   },
  // ]);

  // for (let index = 0; index < jsAllBooks.length; index++) {
  //   let element = jsAllBooks[index];
  //   if (joinedBooksList[index].result.length == 1) {
  //     if (joinedBooksList[index].result[0].rentActive == true) {
  //       let count = await examplarModel.count({ book: element._id });
  //       jsAllBooks[index].available = count - 1;
  //     } else {
  //       let count = await examplarModel.count({ book: element._id });
  //       jsAllBooks[index].available = count;
  //     }
  //   } else {
  //     let count = await examplarModel.count({ book: element._id });
  //     jsAllBooks[index].available = count;
  //   }
  // }

  // res.send(jsAllBooks);
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
  //to find if the inPut already exists
  const isAlreadyAdded = await bookModel.find({
    author: newSchemaBook.author,
    releaseDate: newSchemaBook.releaseDate,
    title2: newSchemaBook.title,
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
app.delete("/book/:id", (req, res) => {
  bookModel.deleteOne({ _id: req.params.id }, async (error) => {
    if (error) {
      res.status(404).send("the ID is not valid");
    } else {
      const allBooks = await bookModel.find();
      res.send(allBooks);
    }
  });
});
/********************************************************************/
//to edit a book
app.put("/book/:id", function (req, res) {
  bookModel.updateOne(
    { _id: req.params.id },
    { ...req.body },
    async (error) => {
      if (error) {
        res.status(404).send("the ID is not valid");
      } else {
        res.send("The Book has been successfully edited.");
      }
    }
  );
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
  rentExemplarModel.updateOne({ _id: rendID }, { rentActive: false }).then(
    () => res.send("the Rent is ended successfully"),
    () => res.send("the ID is False")
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
