"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const main_1 = __importDefault(require("../controllers/main"));
const router = (0, express_1.Router)();
router.get('/', main_1.default.index);
router.get('/main/story', main_1.default.story_gen);
router.get('/forms/completeForm1', main_1.default.form1);
router.post('/forms/completeForm1', main_1.default.form1);
router.get('/forms/completeForm2', main_1.default.form2);
router.post('/forms/completeForm2', main_1.default.form2);
router.get('/forms/quickForm', main_1.default.quickForm);
router.post('/forms/quickForm', main_1.default.quickForm);
router.get('/download-pdf', main_1.default.generatePDF);
exports.default = router;
