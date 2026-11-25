IF DB_ID(N'ModulTransformasi') IS NULL CREATE DATABASE ModulTransformasi;
GO
USE ModulTransformasi;
GO
IF OBJECT_ID('dbo.Documents') IS NULL CREATE TABLE dbo.Documents (
 Collection nvarchar(80) NOT NULL, Id nvarchar(350) NOT NULL,
 Body nvarchar(max) NOT NULL CHECK(ISJSON(Body)=1), Version rowversion,
 CONSTRAINT PK_Documents PRIMARY KEY(Collection,Id));
IF OBJECT_ID('dbo.Credentials') IS NULL CREATE TABLE dbo.Credentials (
 Email nvarchar(256) NOT NULL PRIMARY KEY, PasswordHash nvarchar(512) NOT NULL);
GO
-- Provision the IIS application pool's Windows identity separately using least privilege.
