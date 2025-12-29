# Rekordbox Database Schema Diagram

Entity relationship diagram for the Rekordbox 6/7 database.

```mermaid
erDiagram
    djmdContent ||--o{ djmdSongHistory : "played in"
    djmdContent ||--o{ djmdCue : "has"
    djmdContent ||--o{ djmdSongPlaylist : "in playlist"
    djmdContent ||--o{ djmdMixerParam : "has"
    djmdContent }o--|| djmdArtist : "artist"
    djmdContent }o--|| djmdAlbum : "album"
    djmdContent }o--|| djmdGenre : "genre"
    djmdContent }o--|| djmdLabel : "label"
    djmdContent }o--|| djmdKey : "key"
    djmdContent }o--|| djmdColor : "color"
    djmdContent }o--o| djmdArtist : "remixer"

    djmdHistory ||--o{ djmdSongHistory : "contains"
    djmdPlaylist ||--o{ djmdSongPlaylist : "contains"

    djmdContent {
        varchar ID PK
        varchar FolderPath
        varchar Title
        varchar ArtistID FK
        varchar AlbumID FK
        varchar GenreID FK
        varchar LabelID FK
        varchar KeyID FK
        varchar ColorID FK
        varchar RemixerID FK
        int BPM
        int Length
        int Rating
        varchar ImagePath
    }

    djmdArtist {
        varchar ID PK
        varchar Name
    }

    djmdAlbum {
        varchar ID PK
        varchar Name
        varchar AlbumArtistID FK
        varchar ImagePath
    }

    djmdGenre {
        varchar ID PK
        varchar Name
    }

    djmdLabel {
        varchar ID PK
        varchar Name
    }

    djmdKey {
        varchar ID PK
        varchar ScaleName
    }

    djmdColor {
        varchar ID PK
        int ColorCode
    }

    djmdHistory {
        varchar ID PK
        varchar Name
        varchar DateCreated
    }

    djmdSongHistory {
        varchar ID PK
        varchar HistoryID FK
        varchar ContentID FK
        int TrackNo
        datetime created_at
    }

    djmdPlaylist {
        varchar ID PK
        varchar Name
        varchar ParentID FK
        int Attribute
    }

    djmdSongPlaylist {
        varchar ID PK
        varchar PlaylistID FK
        varchar ContentID FK
        int TrackNo
    }

    djmdCue {
        varchar ID PK
        varchar ContentID FK
        int InMsec
        int OutMsec
        int Kind
        int Color
        varchar Comment
    }

    djmdMixerParam {
        varchar ID PK
        varchar ContentID FK
        int GainHigh
        int GainLow
        int PeakHigh
        int PeakLow
    }
```

## Key Relationships

| Foreign Key | References |
|-------------|------------|
| djmdSongHistory.HistoryID | djmdHistory.ID |
| djmdSongHistory.ContentID | djmdContent.ID |
| djmdContent.ArtistID | djmdArtist.ID |
| djmdContent.AlbumID | djmdAlbum.ID |
| djmdContent.GenreID | djmdGenre.ID |
| djmdContent.LabelID | djmdLabel.ID |
| djmdContent.KeyID | djmdKey.ID |
| djmdContent.ColorID | djmdColor.ID |
| djmdContent.RemixerID | djmdArtist.ID |
| djmdSongPlaylist.PlaylistID | djmdPlaylist.ID |
| djmdSongPlaylist.ContentID | djmdContent.ID |
| djmdCue.ContentID | djmdContent.ID |
