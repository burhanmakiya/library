import mongoose from "mongoose";
///////////////////////////////////////////////////////
//Book schema
const bookSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    releaseDate: { type: Number, required: true },
    title: { type: String, required: true },
    numberOfPages: { type: Number, required: true },
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
      required: true
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
//////////////////////////////////////////////////////////////
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

export { bookModel, examplarModel, rentExemplarModel, userModel };
