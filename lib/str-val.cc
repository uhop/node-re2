#include "./str-val.h"

StrValBuffer::StrValBuffer(const v8::Local<v8::Value> &arg, size_t newIndex) : StrValBase()
{
	if (!node::Buffer::HasInstance(arg))
		return;

	isBuffer = true;
	size = length = node::Buffer::Length(arg);
	data = node::Buffer::Data(arg);

	byteIndex = index = newIndex;
	isIndexValid = byteIndex < size;
}

inline size_t getUtf8CharSize(char ch)
{
	return ((0xE5000000 >> ((ch >> 3) & 0x1E)) & 3) + 1;
}

inline size_t countBytes(const char *data, size_t from, size_t n)
{
	for (; n > 0; --n)
	{
		size_t s = getUtf8CharSize(data[from]);
		from += s;
		if (s == 4 && n >= 2)
			--n; // this utf8 character will take two utf16 characters
				 // the decrement above is protected to avoid an overflow of an unsigned integer
	}
	return from;
}

StrValString::StrValString(const v8::Local<v8::Value> &arg, size_t newIndex) : StrValBase()
{
	if (node::Buffer::HasInstance(arg))
		return;

	auto t = arg->ToString(Nan::GetCurrentContext());
	if (t.IsEmpty())
	{
		isBad = true;
		return;
	}

	auto s = t.ToLocalChecked();
	length = Nan::DecodeBytes(s);
	size = Nan::DecodeBytes(s, Nan::UTF8);
	buffer.resize(size + 1);
	data = &buffer[0];
	Nan::DecodeWrite(data, size, s, Nan::UTF8);
	buffer[size] = '\0';

	index = newIndex;
	isIndexValid = index <= length;

	if (!isIndexValid || !index)
		return;

	if (index == length)
	{
		byteIndex = size;
		return;
	}

	byteIndex = countBytes(data, 0, index);
}

void StrValBase::setIndex(size_t newIndex)
{
	isIndexValid = newIndex <= length;
	if (!isIndexValid)
	{
		index = newIndex;
		byteIndex = 0;
		return;
	}

	if (newIndex == index)
		return;

	if (isBuffer)
	{
		byteIndex = index = newIndex;
		return;
	}

	// String

	if (!newIndex)
	{
		byteIndex = index = 0;
		return;
	}

	if (newIndex == length)
	{
		byteIndex = size;
		index = length;
		return;
	}

	byteIndex = index < newIndex ? countBytes(data, byteIndex, newIndex - index) : countBytes(data, 0, newIndex);
	index = newIndex;
}

StrValBase *StrValBase::New(const v8::Local<v8::Value> &arg, size_t newIndex)
{
	if (node::Buffer::HasInstance(arg))
		return new StrValBuffer(arg, newIndex);
	return new StrValString(arg, newIndex);
}
