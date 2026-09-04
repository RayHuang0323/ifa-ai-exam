# Question assets staging area

This directory is reserved for manually approved source-image extracts from
Sprint 56 review candidates. Sprint 56 does not copy source images here and
does not run OCR.

When an asset is approved, keep the file under a deterministic path such as
`<source-sha256>/page-001-image-001.ext`, and record that relative path in the
review-only image metadata field `extractedAsset`. Keep `sourceFile`, `page`,
`sourceHash`, image type, and a human description together in the review
record. Do not embed binary data in question JSON, and do not make a question
depend on an unverified image.
