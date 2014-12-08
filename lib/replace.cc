#include "./wrapped_re2.h"

#include <memory>
#include <string>
#include <vector>

#include <node_buffer.h>


using std::auto_ptr;
using std::string;
using std::vector;

using v8::Array;
using v8::Function;
using v8::Integer;
using v8::Local;
using v8::String;
using v8::Value;

using node::Buffer;


inline string replace(const NanUtf8String& replacer, const vector<StringPiece>& groups, const StringPiece& str) {
	string result;
	size_t index, index2;
	for (size_t i = 0, n = len(replacer); i < n; ++i) {
		char ch = (*replacer)[i];
		if (ch == '$') {
			if (i + 1 < n) {
				ch = (*replacer)[++i];
				switch (ch) {
					case '$':
						result += ch;
						continue;
					case '&':
						result += groups[0].as_string();
						continue;
					case '`':
						result += string(str.data(), groups[0].data() - str.data());
						continue;
					case '\'':
						result += string(groups[0].data() + groups[0].size(),
							str.data() + str.size() - groups[0].data() - groups[0].size());
						continue;
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						index = ch - '0';
						if (i + 1 < n) {
							ch = (*replacer)[i + 1];
							if ('0' <= ch && ch <= '9') {
								++i;
								index2 = index * 10 + (ch - '0');
								if (index2 && index2 < groups.size()) {
									result += groups[index2].as_string();
									continue;
								}
								result += '$';
								result += '0' + index;
								result += ch;
								continue;
							}
							if (index && index < groups.size()) {
								result += groups[index].as_string();
								continue;
							}
							result += '$';
							result += '0' + index;
							continue;
						}
						if (index && index < groups.size()) {
							result += groups[index].as_string();
							continue;
						}
						break;
				}
				result += '$';
			}
		}
		result += ch;
	}
	return result;
}


static string replace(WrappedRE2* re2, const StringPiece& str, const NanUtf8String& replacer) {

	const char* data = str.data();
	size_t      size = str.size();

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);
	const StringPiece& match = groups[0];

	size_t lastIndex = 0;
	string result;

	while (lastIndex <= size && re2->regexp.Match(str, lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				result += string(data + lastIndex, match.data() - data - lastIndex);
			}
			result += replace(replacer, groups, str);
			lastIndex = match.data() - data + match.size();
		} else {
			result += replace(replacer, groups, str);
			if (lastIndex < size) {
				result += data[lastIndex];
			}
			++lastIndex;
		}
		if (!re2->global) {
			break;
		}
	}
	if (lastIndex < size) {
		result += string(data + lastIndex, size - lastIndex);
	}

	return result;
}


inline string replace(const NanCallback& replacer, const vector<StringPiece>& groups,
						const StringPiece& str, const Local<Value>& input) {
	vector< Local<Value> >	argv;
	for (size_t i = 0, n = groups.size(); i < n; ++i) {
		const StringPiece& item = groups[i];
		argv.push_back(NanNew<String>(item.data(), item.size()));
	}
	argv.push_back(NanNew<Integer>(groups[0].data() - str.data()));
	argv.push_back(input);

	NanUtf8String result(replacer.Call(argv.size(), &argv[0])->ToString());

	return string(*result, len(result));
}


static string replace(WrappedRE2* re2, const StringPiece& str,
						const NanCallback& replacer, const Local<Value>& input) {

	const char* data = str.data();
	size_t      size = str.size();

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);
	const StringPiece& match = groups[0];

	size_t lastIndex = 0;
	string result;

	while (lastIndex <= size && re2->regexp.Match(str, lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				result += string(data + lastIndex, match.data() - data - lastIndex);
			}
			result += replace(replacer, groups, str, input);
			lastIndex = match.data() - data + match.size();
		} else {
			result += replace(replacer, groups, str, input);
			if (lastIndex < size) {
				result += data[lastIndex];
			}
			++lastIndex;
		}
		if (!re2->global) {
			break;
		}
	}
	if (lastIndex < size) {
		result += string(data + lastIndex, size - lastIndex);
	}

	return result;
}


NAN_METHOD(WrappedRE2::Replace) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(args[0]);
	}

	auto_ptr<NanUtf8String> buffer;

	char*  data;
	size_t size;
	if (args[0]->IsString()){
		buffer.reset(new NanUtf8String(args[0]));
		data = **buffer;
		size = len(*buffer);
	} else if (Buffer::HasInstance(args[0])) {
		data = Buffer::Data(args[0]);
		size = Buffer::Length(args[0]);
	} else {
		NanReturnValue(args[0]);
	}

	StringPiece str(data, size);

	if (args[1]->IsString()) {
		NanReturnValue(NanNew(replace(re2, str, NanUtf8String(args[1]))));
	}

	if (args[1]->IsFunction()) {
		NanReturnValue(NanNew(replace(re2, str, NanCallback(args[1].As<Function>()), args[0])));
	}

	NanReturnValue(args[0]);
}
