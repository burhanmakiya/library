import express from "express";
import mongoose from "mongoose";
import _, { result } from "underscore";
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
  res.send(jsAllBooks);
});
/********************************************************************/
//to add a new book
app.post("/books", (req, res) => {
  //to save the Input in a Schema Model
  const reqBodyInput = new bookModel({ ...req.body });
  //to search if the Book is already exists
  //if the Book is already exists the Adding prossses will stop
  bookModel.find(req.body, (err, result) => {
    if (err) {
      res.status(404).send(err.message);
    } else if (result.length == 0) {
      reqBodyInput
        .save()
        .then(() => res.status(200).send("added successfully"))
        .catch((err) => res.status(404).send(err.message));
    } else {
      res.status(404).send("already added");
    }
  });
});
/********************************************************************/
// to remove a Book
app.delete("/book/:id", (req, res) => {
  // check if the Book has exemplars
  // if not, then remove it
  examplarModel.find({ book: req.params.id }, (err, resultFindEx) => {
    if (err) {
      res.status(404).send(err.message);
    } else if (resultFindEx.length == 0) {
      bookModel.findByIdAndDelete(req.params.id, (err, removeResult) => {
        if (err) {
          res.status(404).send(err.message);
        } else if (removeResult == null) {
          res.status(404).send("ID not found");
        } else {
          res.status(200).send("deleted");
        }
      });
    } else {
      res.status(404).send("the Book has Exemplar");
    }
  });
});
/********************************************************************/
//to edit a book
app.put("/book/:id", function (req, res) {
  const bodyInput = req.body;
  //to check if the ID is valid
  bookModel
    .find({ _id: req.params.id })
    .then(
      (result) => {
        // to join the inPut with the Target object
        let mergedObjects = JSON.parse(
          JSON.stringify(_.extend(result[0], bodyInput))
        );
        delete mergedObjects._id; // to remove the ID
        bookModel.find(mergedObjects).then((result) => {
          if (result.length == 0) {
            bookModel
              .updateOne({ _id: req.params.id }, { ...req.body })
              .then(() => {
                res.status(200).send("updatetd");
              });
          } else {
            res.status(404).send("already exists");
          }
        });
      },
      (err) => {
        console.log(err);
        res.send(err.message);
      }
    )
    .catch((er) => {
      res.status(404).send(er.message);
    });
});
/********************************************************************/
/********************************************************************/
/********************************************************************/
/**********************Exemplar**************************************/
// to add an Exemplar
app.post("/exemplar", (req, res) => {
  const newSchemaExemplar = new examplarModel({
    book: req.body.book,
  });
  bookModel.findById(req.body.book, function (err, result) {
    if (err) {
      res.status(404).send(err.message);
    } else if (result == null) {
      res.status(404).send("ID is Invalid");
    } else {
      newSchemaExemplar
        .save()
        .then(() => res.send("the Exemplar has been successfully added"))
        .catch((err) => res.status(404).send(err.message));
    }
  });
});
/********************************************************************/
//to see the exemplar_list
app.get("/exemplar", (req, res) => {
  let queryInput = req.query;
  examplarModel.find(queryInput, (err, result) => {
    if (err) {
      res.status(404).send(err.message);
    } else {
      res.status(200).send(result);
    }
  });
});
/************************************************************/
//to remove Exemplar
app.delete("/exemplar/:id", (req, res) => {
  examplarModel.find({ _id: req.params.id }, (err, findResult) => {
    if (err) {
      res.status(404).send(err.message);
    } else if (findResult.length == 0) {
      res.status(404).send("Exempler ID not found");
    } else {
      rentExemplarModel.find(
        { bookExemplarID: req.params.id },
        function (err, result) {
          if (err) {
            res.status(404).send(err.message);
          } else if (result.length == 0 || result[0].rentActive == false) {
            examplarModel.deleteOne({ _id: req.params.id }, function (err) {
              if (err) {
                res.status(404).send(err.message);
              } else {
                res.status(200).send("Exempler deleted");
              }
            });
          } else {
            res.status(404).send("rent Aktive");
          }
        }
      );
    }
  });
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
    let findID = await examplarModel.findById(req.body.bookExemplarID);
    let isActive = await rentExemplarModel.find({bookExemplarID: req.body.bookExemplarID,rentActive: true,});
    let userID = await userModel.findById(req.body.userID);

    if (_.isNull(findID)) {
      res.status(404).send("Exempler ID is invalid");
    } else if (_.isNull(userID)) {
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
      console.log("a");
      res.status(200).send("Rent Complete");
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
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
