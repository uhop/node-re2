#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>


using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;


NAN_METHOD(WrappedRE2::Match) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnNull();
	}

	StrVal a(args[0]);
	vector<StringPiece> groups;
	StringPiece str(a);

	// actual work

	if (re2->global) {
		// global: collect all matches

		StringPiece match;
		size_t lastIndex = 0;

		while (re2->regexp.Match(str, lastIndex, a.size, RE2::UNANCHORED, &match, 1)) {
			groups.push_back(match);
			lastIndex = match.data() - a.data + match.size();
		}

		if (groups.empty()) {
			NanReturnNull();
		}
	} else {
		// non-global: just like exec()

		groups.resize(re2->regexp.NumberOfCapturingGroups() + 1);
		if (!re2->regexp.Match(str, 0, a.size, RE2::UNANCHORED, &groups[0], groups.size())) {
			NanReturnNull();
		}
	}

	// form a result

	Local<Array> result = NanNew<Array>();

	if (a.isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			result->Set(i, NanNewBufferHandle(item.data(), item.size()));
		}
		if (!re2->global) {
			result->Set(NanNew("index"), NanNew<Integer>(static_cast<int>(groups[0].data() - a.data)));
			result->Set(NanNew("input"), args[0]);
		}
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			result->Set(i, NanNew<String>(item.data(), item.size()));
		}
		if (!re2->global) {
			result->Set(NanNew("index"), NanNew<Integer>(static_cast<int>(getUtf16Length(a.data, groups[0].data()))));
			result->Set(NanNew("input"), args[0]);
		}
	}

	NanReturnValue(result);
}
