#pragma once
#include <vector>
#include <nan.h>
#include <re2/re2.h>

struct StrValBase
{
	char *data;
	size_t size, length;
	size_t index, byteIndex;
	bool isBuffer, isIndexValid, isBad;

	StrValBase() : data(NULL), size(0), length(0), index(0), byteIndex(0), isBuffer(false), isIndexValid(false), isBad(false) {}

	operator re2::StringPiece() const { return re2::StringPiece(data, size); }

	void setIndex(size_t newIndex = 0);

	static StrValBase *New(const v8::Local<v8::Value> &arg, size_t newIndex = 0);
};

struct StrValBuffer : public StrValBase
{
	StrValBuffer(const v8::Local<v8::Value> &arg, size_t newIndex = 0);
};

struct StrValString : public StrValBase
{
	StrValString(const v8::Local<v8::Value> &arg, size_t newIndex = 0);

	std::vector<char> buffer;
};
