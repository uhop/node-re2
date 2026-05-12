#pragma once

#include <atomic>
#include <string>
#include <nan.h>
#include <re2/re2.h>

#include "./isolate_data.h"

struct StrVal
{
	char *data;
	size_t size, length;
	size_t index, byteIndex;
	bool isBuffer, isValidIndex, isBad;

	StrVal() : data(NULL), size(0), length(0), index(0), byteIndex(0), isBuffer(false), isValidIndex(false), isBad(false) {}

	operator re2::StringPiece() const { return re2::StringPiece(data, size); }

	void setIndex(size_t newIndex = 0);
	void reset(const v8::Local<v8::Value> &arg, size_t size, size_t length, size_t newIndex = 0, bool buffer = false);

	void clear()
	{
		isBad = isBuffer = isValidIndex = false;
		size = length = index = byteIndex = 0;
		data = nullptr;
	}
};

class WrappedRE2 : public Nan::ObjectWrap
{
private:
	WrappedRE2(
		const re2::StringPiece &pattern,
		const re2::RE2::Options &options,
		const std::string &src,
		const bool &g,
		const bool &i,
		const bool &m,
		const bool &s,
		const bool &y,
		const bool &d) : regexp(pattern, options),
						 source(src),
						 global(g),
						 ignoreCase(i),
						 multiline(m),
						 dotAll(s),
						 sticky(y),
						 hasIndices(d),
						 lastIndex(0) {}

	static NAN_METHOD(New);
	static NAN_METHOD(ToString);

	static NAN_GETTER(GetSource);
	static NAN_GETTER(GetFlags);
	static NAN_GETTER(GetGlobal);
	static NAN_GETTER(GetIgnoreCase);
	static NAN_GETTER(GetMultiline);
	static NAN_GETTER(GetDotAll);
	static NAN_GETTER(GetUnicode);
	static NAN_GETTER(GetSticky);
	static NAN_GETTER(GetHasIndices);
	static NAN_GETTER(GetLastIndex);
	static NAN_SETTER(SetLastIndex);
	static NAN_GETTER(GetInternalSource);

	// RegExp methods
	static NAN_METHOD(Exec);
	static NAN_METHOD(Test);

	// String methods
	static NAN_METHOD(Match);
	static NAN_METHOD(Replace);
	static NAN_METHOD(Search);
	static NAN_METHOD(Split);

	// strict Unicode warning support
	static NAN_GETTER(GetUnicodeWarningLevel);
	static NAN_SETTER(SetUnicodeWarningLevel);

public:
	~WrappedRE2();

	static v8::Local<v8::Function> Init();

	static inline bool HasInstance(v8::Local<v8::Object> object)
	{
		auto isolate = v8::Isolate::GetCurrent();
		auto data = getAddonData(isolate);
		if (!data || data->re2Tpl.IsEmpty()) return false;
		return data->re2Tpl.Get(isolate)->HasInstance(object);
	}

	enum UnicodeWarningLevels
	{
		NOTHING,
		WARN_ONCE,
		WARN,
		THROW
	};
	static std::atomic<UnicodeWarningLevels> unicodeWarningLevel;
	static std::atomic<bool> alreadyWarnedAboutUnicode;

	re2::RE2 regexp;
	std::string source;
	bool global;
	bool ignoreCase;
	bool multiline;
	bool dotAll;
	bool sticky;
	bool hasIndices;
	size_t lastIndex;

	friend struct PrepareLastString;

private:
	Nan::Persistent<v8::Value> lastString; // weak pointer
	Nan::Persistent<v8::Object> lastCache; // weak pointer
	StrVal lastStringValue;

	void dropCache();
	const StrVal &prepareArgument(const v8::Local<v8::Value> &arg, bool ignoreLastIndex = false);
	void doneWithLastString();
};

struct PrepareLastString
{
	PrepareLastString(WrappedRE2 *re2, const v8::Local<v8::Value> &arg, bool ignoreLastIndex = false) : re2(re2) {
		re2->prepareArgument(arg, ignoreLastIndex);
	}

	~PrepareLastString() {
		re2->doneWithLastString();
	}

	operator const StrVal&() const {
		return re2->lastStringValue;
	}

	operator StrVal&() {
		return re2->lastStringValue;
	}

	WrappedRE2 *re2;
};

// utilities

inline size_t getUtf8Length(const uint16_t *from, const uint16_t *to)
{
	size_t n = 0;
	while (from != to)
	{
		uint16_t ch = *from++;
		if (ch <= 0x7F)
			++n;
		else if (ch <= 0x7FF)
			n += 2;
		else if (0xD800 <= ch && ch <= 0xDFFF)
		{
			n += 4;
			if (from == to)
				break;
			++from;
		}
		else if (ch < 0xFFFF)
			n += 3;
		else
			n += 4;
	}
	return n;
}

inline size_t getUtf16Length(const char *from, const char *to)
{
	size_t n = 0;
	while (from != to)
	{
		unsigned ch = *from & 0xFF;
		if (ch < 0xF0)
		{
			if (ch < 0x80)
			{
				++from;
			}
			else
			{
				if (ch < 0xE0)
				{
					from += 2;
					if (from == to + 1)
					{
						++n;
						break;
					}
				}
				else
				{
					from += 3;
					if (from > to && from < to + 3)
					{
						++n;
						break;
					}
				}
			}
			++n;
		}
		else
		{
			from += 4;
			n += 2;
			if (from > to && from < to + 4)
				break;
		}
	}
	return n;
}

inline size_t getUtf8CharSize(char ch)
{
	return ((0xE5000000 >> ((ch >> 3) & 0x1E)) & 3) + 1;
}

// V8 13.4 introduced Utf8LengthV2 / WriteUtf8V2; V8 14.6 removed the bare
// Utf8Length / WriteUtf8. On older V8 (Node 22) only the bare forms exist.
#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 13 || \
    (V8_MAJOR_VERSION == 13 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION >= 4))

inline size_t utf8Length(v8::Local<v8::String> s, v8::Isolate *isolate)
{
	return s->Utf8LengthV2(isolate);
}

inline void writeUtf8(v8::Local<v8::String> s, v8::Isolate *isolate, char *buffer, size_t capacity)
{
	s->WriteUtf8V2(isolate, buffer, capacity);
}

#else

inline size_t utf8Length(v8::Local<v8::String> s, v8::Isolate *isolate)
{
	return static_cast<size_t>(s->Utf8Length(isolate));
}

inline void writeUtf8(v8::Local<v8::String> s, v8::Isolate *isolate, char *buffer, size_t capacity)
{
	s->WriteUtf8(isolate, buffer, static_cast<int>(capacity));
}

#endif

inline size_t getUtf16PositionByCounter(const char *data, size_t from, size_t n)
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
