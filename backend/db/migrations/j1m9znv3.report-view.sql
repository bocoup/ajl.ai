CREATE OR REPLACE VIEW image_annotation_report AS
  SELECT
    ia.id,
    ia.annotator_id,
    ia.workload_id,
    ia.image_id,
    i.url,
    aa.name AS attribute,
    ao.name AS value
  FROM image_annotation ia
    LEFT JOIN image i ON ia.image_id = i.id
    LEFT JOIN annotation_option ao ON ia.annotation_option_id = ao.id
    LEFT JOIN annotation_attribute aa ON ao.annotation_attribute_id = aa.id;
---
DROP VIEW image_annotation_report;
