-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type in ('linger', 'one_off', 'process')),
    language TEXT NOT NULL,
    path TEXT NOT NULL,
    entry TEXT DEFAULT(NULL),
    port TEXT DEFAULT(NULL),
    domain TEXT DEFAULT(NULL),
    status TEXT NOT NULL CHECK(status in ('running', 'stopped')) DEFAULT('stopped'),
    created_at NOT NULL DEFAULT(datetime('now'))
);

-- Enum for themes
CREATE TABLE IF NOT EXISTS enum_theme_family (
    theme_id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme TEXT NOT NULL UNIQUE
);

-- Axes table
CREATE TABLE IF NOT EXISTS axes (
    axis_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    theme_id INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK(direction in ('isolate', 'uplink', 'beacon', 'relay')),
    criticality TEXT NOT NULL CHECK(criticality in ('day', 'week', 'fortnight', 'month')),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES enum_theme_family(theme_id) ON DELETE CASCADE
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL UNIQUE,
    mime TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at NOT NULL DEFAULT(datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- Archive table
CREATE TABLE IF NOT EXISTS archive (
    archive_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type in ('linger', 'one_off', 'process')),
    language TEXT NOT NULL,
    path TEXT NOT NULL,
    entry TEXT DEFAULT(NULL),
    port TEXT DEFAULT(NULL),
    domain TEXT DEFAULT(NULL),
    status TEXT NOT NULL CHECK(status in ('running', 'stopped')) DEFAULT('stopped'),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);


INSERT INTO enum_theme_family (theme) VALUES ('root'), ('court'), ('midas'), ('eclipse'), ('ambassador');
