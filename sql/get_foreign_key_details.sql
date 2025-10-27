SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS referenced_table,
    af.attname AS referenced_column
FROM
    pg_constraint AS c
    JOIN pg_class ON c.conrelid = pg_class.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY (c.confkey)
WHERE
    c.contype = 'f'
    AND conname = 'FK_1fba89031612ce9105de6a77d3f'; 