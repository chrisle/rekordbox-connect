# Rekordbox Database Schema

This document describes the schema of the Rekordbox 6/7 SQLCipher-encrypted database.

See also: [Schema Diagram](schema-diagram.md)

## Tables

| Table | Description |
|-------|-------------|
| [agentNotification](#agentnotification) | Cloud agent notifications |
| [agentNotificationLog](#agentnotificationlog) | Notification event logs |
| [agentRegistry](#agentregistry) | Agent configuration storage |
| [cloudAgentRegistry](#cloudagentregistry) | Cloud sync agent registry |
| [contentActiveCensor](#contentactivecensor) | Active censor regions for cloud sync |
| [contentCue](#contentcue) | Cue points for cloud sync |
| [contentFile](#contentfile) | Audio file sync status |
| [djmdActiveCensor](#djmdactivecensor) | Active censor/silence regions |
| [djmdAlbum](#djmdalbum) | Album metadata |
| [djmdArtist](#djmdartist) | Artist metadata |
| [djmdCategory](#djmdcategory) | Browser categories |
| [djmdCloudExportPlaylist](#djmdcloudexportplaylist) | Cloud export playlists |
| [djmdCloudExportSongPlaylist](#djmdcloudexportsongplaylist) | Cloud export playlist tracks |
| [djmdCloudFilterPlaylist](#djmdcloudfilterplaylist) | Cloud filter playlists |
| [djmdCloudProperty](#djmdcloudproperty) | Cloud sync properties |
| [djmdColor](#djmdcolor) | Track color labels |
| [djmdContent](#djmdcontent) | **Main track library** |
| [djmdCue](#djmdcue) | Cue points and loops |
| [djmdDevice](#djmddevice) | Linked devices |
| [djmdGenre](#djmdgenre) | Genre metadata |
| [djmdHistory](#djmdhistory) | **History sessions/playlists** |
| [djmdHotCueBanklist](#djmdhotcuebanklist) | Hot cue banks |
| [djmdKey](#djmdkey) | Musical key metadata |
| [djmdLabel](#djmdlabel) | Record label metadata |
| [djmdMenuItems](#djmdmenuitems) | Menu configuration |
| [djmdMixerParam](#djmdmixerparam) | Track mixer parameters (gain, peak) |
| [djmdMyTag](#djmdmytag) | Custom tags |
| [djmdPlaylist](#djmdplaylist) | Playlists |
| [djmdProperty](#djmdproperty) | Database properties |
| [djmdRecommendLike](#djmdrecommendlike) | Track recommendations |
| [djmdRelatedTracks](#djmdrelatedtracks) | Related tracks configuration |
| [djmdSampler](#djmdsampler) | Sampler banks |
| [djmdSharedPlaylist](#djmdsharedplaylist) | Shared playlists |
| [djmdSharedPlaylistUser](#djmdsharedplaylistuser) | Shared playlist members |
| [djmdSongHistory](#djmdsonghistory) | **Individual play history entries** |
| [djmdSongHotCueBanklist](#djmdsonghotcuebanklist) | Hot cue bank assignments |
| [djmdSongMyTag](#djmdsongmytag) | Track tag assignments |
| [djmdSongPlaylist](#djmdsongplaylist) | Playlist track assignments |
| [djmdSongRelatedTracks](#djmdsongrelatedtracks) | Related track assignments |
| [djmdSongSampler](#djmdsongsampler) | Sampler assignments |
| [djmdSongTagList](#djmdsongtaglist) | Tag list assignments |
| [djmdSort](#djmdsort) | Sort configuration |
| [hotCueBanklistCue](#hotcuebanklistcue) | Hot cue bank cue data |
| [imageFile](#imagefile) | Image file sync status |
| [settingFile](#settingfile) | Settings file sync status |
| [uuidIDMap](#uuididmap) | UUID to ID mappings |

---

## agentNotification

Cloud agent notifications.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | BIGINT | ✓ |
| graphic_area | TINYINT(1) |  |
| text_area | TINYINT(1) |  |
| os_notification | TINYINT(1) |  |
| start_datetime | DATETIME |  |
| end_datetime | DATETIME |  |
| display_datetime | DATETIME |  |
| interval | INTEGER |  |
| category | VARCHAR(255) |  |
| category_color | VARCHAR(255) |  |
| title | TEXT |  |
| description | TEXT |  |
| url | VARCHAR(255) |  |
| image | VARCHAR(255) |  |
| image_path | VARCHAR(255) |  |
| read_status | INTEGER |  |
| last_displayed_datetime | DATETIME |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## agentNotificationLog

Notification event logs.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | INTEGER | ✓ |
| gigya_uid | VARCHAR(255) |  |
| event_date | INTEGER |  |
| reported_datetime | DATETIME |  |
| kind | INTEGER |  |
| value | INTEGER |  |
| notification_id | BIGINT |  |
| link | VARCHAR(255) |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## agentRegistry

Agent configuration storage.

| Column | Type | Primary Key |
|--------|------|-------------|
| registry_id | VARCHAR(255) | ✓ |
| id_1 | VARCHAR(255) |  |
| id_2 | VARCHAR(255) |  |
| int_1 | BIGINT |  |
| int_2 | BIGINT |  |
| str_1 | VARCHAR(255) |  |
| str_2 | VARCHAR(255) |  |
| date_1 | DATETIME |  |
| date_2 | DATETIME |  |
| text_1 | TEXT |  |
| text_2 | TEXT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## cloudAgentRegistry

Cloud sync agent registry.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| int_1 | BIGINT |  |
| int_2 | BIGINT |  |
| str_1 | VARCHAR(255) |  |
| str_2 | VARCHAR(255) |  |
| date_1 | DATETIME |  |
| date_2 | DATETIME |  |
| text_1 | TEXT |  |
| text_2 | TEXT |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## contentActiveCensor

Active censor regions for cloud sync.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID | VARCHAR(255) |  |
| ActiveCensors | TEXT |  |
| rb_activecensor_count | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## contentCue

Cue points for cloud sync.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID | VARCHAR(255) |  |
| Cues | TEXT |  |
| rb_cue_count | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## contentFile

Audio file sync status.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID | VARCHAR(255) |  |
| Path | VARCHAR(255) |  |
| Hash | VARCHAR(255) |  |
| Size | INTEGER |  |
| rb_local_path | VARCHAR(255) |  |
| rb_insync_hash | VARCHAR(255) |  |
| rb_insync_local_usn | BIGINT |  |
| rb_file_hash_dirty | INTEGER |  |
| rb_local_file_status | INTEGER |  |
| rb_in_progress | TINYINT(1) |  |
| rb_process_type | INTEGER |  |
| rb_temp_path | VARCHAR(255) |  |
| rb_priority | INTEGER |  |
| rb_file_size_dirty | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdActiveCensor

Active censor/silence regions in tracks.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID | VARCHAR(255) |  |
| InMsec | INTEGER |  |
| OutMsec | INTEGER |  |
| Info | INTEGER |  |
| ParameterList | TEXT |  |
| ContentUUID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdAlbum

Album metadata.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Name | VARCHAR(255) |  |
| AlbumArtistID | VARCHAR(255) |  |
| ImagePath | VARCHAR(255) |  |
| Compilation | INTEGER |  |
| SearchStr | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdArtist

Artist metadata.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Name | VARCHAR(255) |  |
| SearchStr | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdCategory

Browser categories.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| MenuItemID | VARCHAR(255) |  |
| Seq | INTEGER |  |
| Disable | INTEGER |  |
| InfoOrder | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdCloudExportPlaylist

Cloud export playlists.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Seq | INTEGER |  |
| Name | VARCHAR(255) |  |
| ImagePath | VARCHAR(255) |  |
| Attribute | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| SmartList | TEXT |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdCloudExportSongPlaylist

Cloud export playlist track assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| CloudExportPlaylistID | VARCHAR(255) |  |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdCloudFilterPlaylist

Cloud filter playlists.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| PlaylistUUID | VARCHAR(255) |  |
| Seq | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdCloudProperty

Cloud sync properties.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Reserved1 | TEXT |  |
| Reserved2 | TEXT |  |
| Reserved3 | TEXT |  |
| Reserved4 | TEXT |  |
| Reserved5 | TEXT |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdColor

Track color labels.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ColorCode | INTEGER |  |
| SortKey | INTEGER |  |
| Commnt | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdContent

**Main track library.** Contains all track metadata.

| Column | Type | Primary Key | Description |
|--------|------|-------------|-------------|
| ID | VARCHAR(255) | ✓ | Unique track ID |
| FolderPath | VARCHAR(255) |  | Full file path |
| FileNameL | VARCHAR(255) |  | Long filename |
| FileNameS | VARCHAR(255) |  | Short filename |
| Title | VARCHAR(255) |  | Track title |
| ArtistID | VARCHAR(255) |  | → djmdArtist.ID |
| AlbumID | VARCHAR(255) |  | → djmdAlbum.ID |
| GenreID | VARCHAR(255) |  | → djmdGenre.ID |
| BPM | INTEGER |  | BPM × 100 (e.g., 12800 = 128.00) |
| Length | INTEGER |  | Duration in seconds |
| TrackNo | INTEGER |  | Album track number |
| BitRate | INTEGER |  | Bitrate in kbps |
| BitDepth | INTEGER |  | Bit depth |
| Commnt | TEXT |  | User comment |
| FileType | INTEGER |  | File format type |
| Rating | INTEGER |  | Star rating (0-5) |
| ReleaseYear | INTEGER |  | Release year |
| RemixerID | VARCHAR(255) |  | → djmdArtist.ID |
| LabelID | VARCHAR(255) |  | → djmdLabel.ID |
| OrgArtistID | VARCHAR(255) |  | Original artist |
| KeyID | VARCHAR(255) |  | → djmdKey.ID |
| StockDate | VARCHAR(255) |  | Date added |
| ColorID | VARCHAR(255) |  | → djmdColor.ID |
| DJPlayCount | INTEGER |  | Play count |
| ImagePath | VARCHAR(255) |  | Album art path |
| MasterDBID | VARCHAR(255) |  | Master database ID |
| MasterSongID | VARCHAR(255) |  | Master song ID |
| AnalysisDataPath | VARCHAR(255) |  | Analysis data file |
| SearchStr | VARCHAR(255) |  | Search string |
| FileSize | INTEGER |  | File size in bytes |
| DiscNo | INTEGER |  | Disc number |
| ComposerID | VARCHAR(255) |  | Composer ID |
| Subtitle | VARCHAR(255) |  | Track subtitle |
| SampleRate | INTEGER |  | Sample rate in Hz |
| DisableQuantize | INTEGER |  | Quantize disabled |
| Analysed | INTEGER |  | Analysis status |
| ReleaseDate | VARCHAR(255) |  | Release date |
| DateCreated | VARCHAR(255) |  | Date created |
| ContentLink | INTEGER |  | Content link type |
| Tag | VARCHAR(255) |  | Tags |
| ModifiedByRBM | VARCHAR(255) |  | Modified by RBM |
| HotCueAutoLoad | VARCHAR(255) |  | Hot cue auto-load |
| DeliveryControl | VARCHAR(255) |  | Delivery control |
| DeliveryComment | VARCHAR(255) |  | Delivery comment |
| CueUpdated | VARCHAR(255) |  | Cue updated flag |
| AnalysisUpdated | VARCHAR(255) |  | Analysis updated |
| TrackInfoUpdated | VARCHAR(255) |  | Track info updated |
| Lyricist | VARCHAR(255) |  | Lyricist |
| ISRC | VARCHAR(255) |  | ISRC code |
| SamplerTrackInfo | INTEGER |  | Sampler info |
| SamplerPlayOffset | INTEGER |  | Sampler offset |
| SamplerGain | FLOAT |  | Sampler gain |
| VideoAssociate | VARCHAR(255) |  | Video association |
| LyricStatus | INTEGER |  | Lyrics status |
| ServiceID | INTEGER |  | Service ID |
| OrgFolderPath | VARCHAR(255) |  | Original folder path |
| Reserved1 | TEXT |  | Reserved |
| Reserved2 | TEXT |  | Reserved |
| Reserved3 | TEXT |  | Reserved |
| Reserved4 | TEXT |  | Reserved |
| ExtInfo | TEXT |  | Extended info |
| rb_file_id | VARCHAR(255) |  | Cloud file ID |
| DeviceID | VARCHAR(255) |  | Device ID |
| rb_LocalFolderPath | VARCHAR(255) |  | Local folder path |
| SrcID | VARCHAR(255) |  | Source ID |
| SrcTitle | VARCHAR(255) |  | Source title |
| SrcArtistName | VARCHAR(255) |  | Source artist |
| SrcAlbumName | VARCHAR(255) |  | Source album |
| SrcLength | INTEGER |  | Source length |
| UUID | VARCHAR(255) |  | UUID |
| rb_data_status | INTEGER |  | Sync status |
| rb_local_data_status | INTEGER |  | Local sync status |
| rb_local_deleted | TINYINT(1) |  | Deleted flag |
| rb_local_synced | TINYINT(1) |  | Synced flag |
| usn | BIGINT |  | Update sequence |
| rb_local_usn | BIGINT |  | Local USN |
| created_at | DATETIME |  | Created timestamp |
| updated_at | DATETIME |  | Updated timestamp |

---

## djmdCue

Cue points and loops.

| Column | Type | Primary Key | Description |
|--------|------|-------------|-------------|
| ID | VARCHAR(255) | ✓ | Unique cue ID |
| ContentID | VARCHAR(255) |  | → djmdContent.ID |
| InMsec | INTEGER |  | Start position (ms) |
| InFrame | INTEGER |  | Start frame |
| InMpegFrame | INTEGER |  | Start MPEG frame |
| InMpegAbs | INTEGER |  | Start MPEG absolute |
| OutMsec | INTEGER |  | End position (ms) |
| OutFrame | INTEGER |  | End frame |
| OutMpegFrame | INTEGER |  | End MPEG frame |
| OutMpegAbs | INTEGER |  | End MPEG absolute |
| Kind | INTEGER |  | Cue type (0=cue, 4=loop) |
| Color | INTEGER |  | Cue color |
| ColorTableIndex | INTEGER |  | Color table index |
| ActiveLoop | INTEGER |  | Active loop flag |
| Comment | VARCHAR(255) |  | Cue comment |
| BeatLoopSize | INTEGER |  | Beat loop size |
| CueMicrosec | INTEGER |  | Microsecond precision |
| InPointSeekInfo | VARCHAR(255) |  | Seek info |
| OutPointSeekInfo | VARCHAR(255) |  | Seek info |
| ContentUUID | VARCHAR(255) |  | Content UUID |
| UUID | VARCHAR(255) |  | UUID |
| rb_data_status | INTEGER |  | Sync status |
| rb_local_data_status | INTEGER |  | Local sync status |
| rb_local_deleted | TINYINT(1) |  | Deleted flag |
| rb_local_synced | TINYINT(1) |  | Synced flag |
| usn | BIGINT |  | Update sequence |
| rb_local_usn | BIGINT |  | Local USN |
| created_at | DATETIME |  | Created timestamp |
| updated_at | DATETIME |  | Updated timestamp |

---

## djmdDevice

Linked devices.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| MasterDBID | VARCHAR(255) |  |
| Name | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdGenre

Genre metadata.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Name | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdHistory

**History sessions/playlists.** Each row represents a DJ session.

| Column | Type | Primary Key | Description |
|--------|------|-------------|-------------|
| ID | VARCHAR(255) | ✓ | Unique history ID |
| Seq | INTEGER |  | Sequence number |
| Name | VARCHAR(255) |  | Session name (usually date) |
| Attribute | INTEGER |  | Attribute flags |
| ParentID | VARCHAR(255) |  | Parent folder ID |
| DateCreated | VARCHAR(255) |  | Session date |
| UUID | VARCHAR(255) |  | UUID |
| rb_data_status | INTEGER |  | Sync status |
| rb_local_data_status | INTEGER |  | Local sync status |
| rb_local_deleted | TINYINT(1) |  | Deleted flag |
| rb_local_synced | TINYINT(1) |  | Synced flag |
| usn | BIGINT |  | Update sequence |
| rb_local_usn | BIGINT |  | Local USN |
| created_at | DATETIME |  | Created timestamp |
| updated_at | DATETIME |  | Updated timestamp |

---

## djmdHotCueBanklist

Hot cue banks.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Seq | INTEGER |  |
| Name | VARCHAR(255) |  |
| ImagePath | VARCHAR(255) |  |
| Attribute | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdKey

Musical key metadata.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ScaleName | VARCHAR(255) |  |
| Seq | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdLabel

Record label metadata.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Name | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdMenuItems

Menu configuration.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Class | INTEGER |  |
| Name | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdMixerParam

Track mixer parameters.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID | VARCHAR(255) |  |
| GainHigh | INTEGER |  |
| GainLow | INTEGER |  |
| PeakHigh | INTEGER |  |
| PeakLow | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdMyTag

Custom tags.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Seq | INTEGER |  |
| Name | VARCHAR(255) |  |
| Attribute | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdPlaylist

Playlists.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Seq | INTEGER |  |
| Name | VARCHAR(255) |  |
| ImagePath | VARCHAR(255) |  |
| Attribute | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| SmartList | TEXT |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdProperty

Database properties.

| Column | Type | Primary Key |
|--------|------|-------------|
| DBID | VARCHAR(255) | ✓ |
| DBVersion | VARCHAR(255) |  |
| BaseDBDrive | VARCHAR(255) |  |
| CurrentDBDrive | VARCHAR(255) |  |
| DeviceID | VARCHAR(255) |  |
| Reserved1 | TEXT |  |
| Reserved2 | TEXT |  |
| Reserved3 | TEXT |  |
| Reserved4 | TEXT |  |
| Reserved5 | TEXT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdRecommendLike

Track recommendations.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID1 | VARCHAR(255) |  |
| ContentID2 | VARCHAR(255) |  |
| LikeRate | INTEGER |  |
| DataCreatedH | INTEGER |  |
| DataCreatedL | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdRelatedTracks

Related tracks configuration.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Seq | INTEGER |  |
| Name | VARCHAR(255) |  |
| Attribute | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| Criteria | TEXT |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSampler

Sampler banks.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Seq | INTEGER |  |
| Name | VARCHAR(255) |  |
| Attribute | INTEGER |  |
| ParentID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSharedPlaylist

Shared playlists.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| data_selection | TINYINT |  |
| edited_at | DATETIME |  |
| int_1 | INTEGER |  |
| int_2 | INTEGER |  |
| str_1 | VARCHAR(255) |  |
| str_2 | VARCHAR(255) |  |
| text_1 | TEXT |  |
| text_2 | TEXT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSharedPlaylistUser

Shared playlist members.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| member_type | TINYINT |  |
| member_id | VARCHAR(255) | ✓ |
| status | TINYINT |  |
| invitation_expires_at | DATETIME |  |
| invited_at | DATETIME |  |
| joined_at | DATETIME |  |
| int_1 | INTEGER |  |
| int_2 | INTEGER |  |
| str_1 | VARCHAR(255) |  |
| str_2 | VARCHAR(255) |  |
| text_1 | TEXT |  |
| text_2 | TEXT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSongHistory

**Individual play history entries.** Each row is a track played in a session.

| Column | Type | Primary Key | Description |
|--------|------|-------------|-------------|
| ID | VARCHAR(255) | ✓ | Unique entry ID |
| HistoryID | VARCHAR(255) |  | → djmdHistory.ID |
| ContentID | VARCHAR(255) |  | → djmdContent.ID |
| TrackNo | INTEGER |  | Order in session |
| UUID | VARCHAR(255) |  | UUID |
| rb_data_status | INTEGER |  | Sync status |
| rb_local_data_status | INTEGER |  | Local sync status |
| rb_local_deleted | TINYINT(1) |  | Deleted flag |
| rb_local_synced | TINYINT(1) |  | Synced flag |
| usn | BIGINT |  | Update sequence |
| rb_local_usn | BIGINT |  | Local USN |
| created_at | DATETIME |  | When track was played |
| updated_at | DATETIME |  | Updated timestamp |

---

## djmdSongHotCueBanklist

Hot cue bank assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| HotCueBanklistID | VARCHAR(255) |  |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| CueID | VARCHAR(255) |  |
| InMsec | INTEGER |  |
| InFrame | INTEGER |  |
| InMpegFrame | INTEGER |  |
| InMpegAbs | INTEGER |  |
| OutMsec | INTEGER |  |
| OutFrame | INTEGER |  |
| OutMpegFrame | INTEGER |  |
| OutMpegAbs | INTEGER |  |
| Color | INTEGER |  |
| ColorTableIndex | INTEGER |  |
| ActiveLoop | INTEGER |  |
| Comment | VARCHAR(255) |  |
| BeatLoopSize | INTEGER |  |
| CueMicrosec | INTEGER |  |
| InPointSeekInfo | VARCHAR(255) |  |
| OutPointSeekInfo | VARCHAR(255) |  |
| HotCueBanklistUUID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSongMyTag

Track tag assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| MyTagID | VARCHAR(255) |  |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSongPlaylist

Playlist track assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| PlaylistID | VARCHAR(255) |  |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSongRelatedTracks

Related track assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| RelatedTracksID | VARCHAR(255) |  |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSongSampler

Sampler assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| SamplerID | VARCHAR(255) |  |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSongTagList

Tag list assignments.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| ContentID | VARCHAR(255) |  |
| TrackNo | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## djmdSort

Sort configuration.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| MenuItemID | VARCHAR(255) |  |
| Seq | INTEGER |  |
| Disable | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## hotCueBanklistCue

Hot cue bank cue data.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| HotCueBanklistID | VARCHAR(255) |  |
| Cues | TEXT |  |
| rb_cue_count | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## imageFile

Image file sync status.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| TableName | VARCHAR(255) |  |
| TargetUUID | VARCHAR(255) |  |
| TargetID | VARCHAR(255) |  |
| Path | VARCHAR(255) |  |
| Hash | VARCHAR(255) |  |
| Size | INTEGER |  |
| rb_local_path | VARCHAR(255) |  |
| rb_insync_hash | VARCHAR(255) |  |
| rb_insync_local_usn | BIGINT |  |
| rb_file_hash_dirty | INTEGER |  |
| rb_local_file_status | INTEGER |  |
| rb_in_progress | TINYINT(1) |  |
| rb_process_type | INTEGER |  |
| rb_temp_path | VARCHAR(255) |  |
| rb_priority | INTEGER |  |
| rb_file_size_dirty | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## settingFile

Settings file sync status.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| Path | VARCHAR(255) |  |
| Hash | VARCHAR(255) |  |
| Size | INTEGER |  |
| rb_local_path | VARCHAR(255) |  |
| rb_insync_hash | VARCHAR(255) |  |
| rb_insync_local_usn | BIGINT |  |
| rb_file_hash_dirty | INTEGER |  |
| rb_file_size_dirty | INTEGER |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## uuidIDMap

UUID to ID mappings.

| Column | Type | Primary Key |
|--------|------|-------------|
| ID | VARCHAR(255) | ✓ |
| TableName | VARCHAR(255) |  |
| TargetUUID | VARCHAR(255) |  |
| CurrentID | VARCHAR(255) |  |
| UUID | VARCHAR(255) |  |
| rb_data_status | INTEGER |  |
| rb_local_data_status | INTEGER |  |
| rb_local_deleted | TINYINT(1) |  |
| rb_local_synced | TINYINT(1) |  |
| usn | BIGINT |  |
| rb_local_usn | BIGINT |  |
| created_at | DATETIME |  |
| updated_at | DATETIME |  |

---

## Notes

- **BPM** is stored as an integer × 100 (e.g., 12800 = 128.00 BPM)
- **Length** is stored in seconds
- All `rb_*` prefixed columns are for cloud sync functionality
- `usn` (Update Sequence Number) is used for sync conflict resolution
- The database uses SQLCipher encryption with Blowfish key derivation
