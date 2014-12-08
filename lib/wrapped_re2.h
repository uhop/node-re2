#ifndef WRAPPED_RE2_H_
#define WRAPPED_RE2_H_


#include <node.h>
#include <nan.h>

#include <re2/re2.h>


using v8::Function;
using v8::Handle;
using v8::Object;
using v8::Persistent;

using node::ObjectWrap;

using re2::RE2;
using re2::StringPiece;


class WrappedRE2 : public ObjectWrap {

	private:
		RE2		regexp;
		bool	global;
		bool	ignoreCase;
		bool	multiline;
		size_t	lastIndex;

		WrappedRE2(const StringPiece& pattern, const RE2::Options& options,
			const bool& g, const bool& i, const bool& m) : regexp(pattern, options),
				global(g), ignoreCase(i), multiline(m), lastIndex(0) {}

		static NAN_METHOD(New);
		static NAN_METHOD(ToString);

		static NAN_GETTER(GetSource);
		static NAN_GETTER(GetGlobal);
		static NAN_GETTER(GetIgnoreCase);
		static NAN_GETTER(GetMultiline);
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

		static Persistent<Function>	constructor;

	public:
		static void Initialize(Handle<Object> exports, Handle<Object> module);
};


// utilities

inline size_t len(const NanUtf8String& s) {
	size_t n = s.length();
	return n && !(*s)[n - 1] ? n - 1 : n;
}


#endif
