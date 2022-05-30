import mongoose from "mongoose";
///////////////////////////////////////////////////////
//Book schema
const bookSchema = new mongoose.Schema(
  {
    author: String,
    releaseDate: Number,
    title: String,
    numberOfPages: Number,
  },
  {
    versionKey: false,
  }
);
const bookModel = mongoose.model("bookModel", bookSchema);
//////////////////////////////////////////////////////////////////
// Exemplar schema
const bookExemplarSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bookModel",
    },
  },
  {
    versionKey: false,
  }
);
const examplarModel = mongoose.model("examplarModel", bookExemplarSchema);
//////////////////////////////////////////////////////////////////////////////
// Exemplar RENT schema
const rentExemplar = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    bookExemplarID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "examplarModel",
    },
    rentDate: Date,
    rentActive: "boolean",
  },
  {
    versionKey: false,
  }
);
const rentExemplarModel = mongoose.model("rentExemplarModel", rentExemplar);
//----------------------------------------------------------------
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: "string",
    },
    email: {
      type: "string",
    },
  },
  {
    versionKey: false,
  }
);
const userModel = mongoose.model("userModel", UserSchema);
//////////////////////////////////////////////////////////////
export { bookModel, examplarModel, rentExemplarModel, userModel };
