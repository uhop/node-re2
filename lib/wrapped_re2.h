#ifndef WRAPPED_RE2_H_
#define WRAPPED_RE2_H_


#include <node.h>
#include <nan.h>

#include <re2/re2.h>


using v8::Function;
using v8::Handle;
using v8::Local;
using v8::Object;
using v8::FunctionTemplate;

using re2::RE2;
using re2::StringPiece;


class WrappedRE2 : public Nan::ObjectWrap {

	private:
		WrappedRE2(const StringPiece& pattern, const RE2::Options& options,
			const bool& g, const bool& i, const bool& m, const bool& y, const bool& scb) : regexp(pattern, options),
				global(g), ignoreCase(i), multiline(m), sticky(y), safeToCutBeginning(scb), lastIndex(0) {}

		static NAN_METHOD(New);
		static NAN_METHOD(ToString);

		static NAN_GETTER(GetSource);
		static NAN_GETTER(GetGlobal);
		static NAN_GETTER(GetIgnoreCase);
		static NAN_GETTER(GetMultiline);
		static NAN_GETTER(GetSticky);
		static NAN_GETTER(GetLastIndex);
		static NAN_SETTER(SetLastIndex);

		// RegExp methods
		static NAN_METHOD(Exec);
		static NAN_METHOD(Test);

		// String methods
		static NAN_METHOD(Match);
		static NAN_METHOD(Replace);
		static NAN_METHOD(Search);
		static NAN_METHOD(Split);

		static Nan::Persistent<Function>			constructor;
		static Nan::Persistent<FunctionTemplate>	ctorTemplate;

	public:
		static void Initialize(Handle<Object> exports, Handle<Object> module);

		static inline bool HasInstance(Local<Object> object) {
			return Nan::New(ctorTemplate)->HasInstance(object);
		}

		RE2		regexp;
		bool	global;
		bool	ignoreCase;
		bool	multiline;
		bool	sticky;
		bool    safeToCutBeginning;
		size_t	lastIndex;

		bool DoExec(const StringPiece& input, StringPiece& match, size_t numberOfGroups = 1);
		bool DoExec(const StringPiece& input, std::vector<StringPiece>& groups, bool autoResizeGroups = true);

		size_t GetStartIndexHint() const;
};


// utilities

inline size_t getUtf8Length(const uint16_t* from, const uint16_t* to) {
	size_t n = 0;
	while (from != to) {
		uint16_t ch = *from++;
		if (ch <= 0x7F) ++n;
		else if (ch <= 0x7FF) n += 2;
		else if (0xD800 <= ch && ch <= 0xDFFF) {
			n += 4;
			if (from == to) break;
			++from;
		}
		else if (ch < 0xFFFF) n += 3;
		else n += 4;
	}
	return n;
}

inline size_t getUtf16Length(const char* from, const char* to) {
	size_t n = 0;
	while (from != to) {
		unsigned ch = *from & 0xFF;
		if (ch < 0xF0) {
			if (ch < 0x80) {
				++from;
			} else {
				if (ch < 0xE0) {
					from += 2;
					if (from == to + 1) {
						++n;
						break;
					}
				} else {
					from += 3;
					if (from > to && from < to + 3) {
						++n;
						break;
					}
				}
			}
			++n;
		} else {
			from += 4;
			n += 2;
			if (from > to && from < to + 4) break;
		}
	}
	return n;
}

inline size_t getUtf8CharSize(char ch) {
	return ((0xE5000000 >> ((ch >> 3) & 0x1E)) & 3) + 1;
}


#endif
