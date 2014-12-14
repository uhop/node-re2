#include "./wrapped_re2.h"

#include <algorithm>
#include <memory>
#include <string>
#include <vector>

#include <node_buffer.h>


using std::min;
using std::string;
using std::vector;

using v8::Array;
using v8::Function;
using v8::Integer;
using v8::Local;
using v8::String;
using v8::Value;

using node::Buffer;


inline int getMaxSubmatch(const NanUtf8String& replacer) {
	int maxSubmatch = 0, index, index2;
	for (size_t i = 0, n = len(replacer); i < n;) {
		char ch = (*replacer)[i];
		if (ch == '$') {
			if (i + 1 < n) {
				ch = (*replacer)[i + 1];
				switch (ch) {
					case '$':
					case '&':
					case '`':
					case '\'':
						i += 2;
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
						if (i + 2 < n) {
							ch = (*replacer)[i + 2];
							if ('0' <= ch && ch <= '9') {
								index2 = index * 10 + (ch - '0');
								if (maxSubmatch < index2) maxSubmatch = index2;
								i += 3;
								continue;
							}
						}
						if (maxSubmatch < index) maxSubmatch = index;
						i += 2;
						continue;
				}
			}
			++i;
			continue;
		}
		i += getUtf8CharSize(ch);
	}
	return maxSubmatch;
}


inline string replace(const NanUtf8String& replacer, const vector<StringPiece>& groups, const StringPiece& str) {
	string result;
	size_t index, index2;
	for (size_t i = 0, n = len(replacer); i < n;) {
		char ch = (*replacer)[i];
		if (ch == '$') {
			if (i + 1 < n) {
				ch = (*replacer)[i + 1];
				switch (ch) {
					case '$':
						result += ch;
						i += 2;
						continue;
					case '&':
						result += groups[0].as_string();
						i += 2;
						continue;
					case '`':
						result += string(str.data(), groups[0].data() - str.data());
						i += 2;
						continue;
					case '\'':
						result += string(groups[0].data() + groups[0].size(),
							str.data() + str.size() - groups[0].data() - groups[0].size());
						i += 2;
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
						if (i + 2 < n) {
							ch = (*replacer)[i + 2];
							if ('0' <= ch && ch <= '9') {
								i += 3;
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
							ch = '0' + index;
						}
						i += 2;
						if (index && index < groups.size()) {
							result += groups[index].as_string();
							continue;
						}
						result += '$';
						result += ch;
						continue;
				}
			}
			result += '$';
			++i;
			continue;
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(*replacer + i, sym_size);
		i += sym_size;
	}
	return result;
}


static string replace(WrappedRE2* re2, const StringPiece& str, const NanUtf8String& replacer) {

	const char* data = str.data();
	size_t      size = str.size();

	vector<StringPiece> groups(min(re2->regexp.NumberOfCapturingGroups(), getMaxSubmatch(replacer)) + 1);
	const StringPiece& match = groups[0];

	size_t lastIndex = 0;
	string result;

	while (lastIndex <= size && re2->regexp.Match(str, lastIndex, size,
				RE2::UNANCHORED, &groups[0], groups.size())) {
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				result += string(data + lastIndex, match.data() - data - lastIndex);
			}
			result += replace(replacer, groups, str);
			lastIndex = match.data() - data + match.size();
		} else {
			result += replace(replacer, groups, str);
			size_t sym_size = getUtf8CharSize(data[lastIndex]);
			if (lastIndex < size) {
				result.append(data + lastIndex, sym_size);
			}
			lastIndex += sym_size;
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
	argv.push_back(NanNew<Integer>(getUtf16Length(str.data(), groups[0].data())));
	argv.push_back(input);

	Local<Value> result(Local<Value>::New(replacer.Call(argv.size(), &argv[0])));

	if (result->IsString()) {
		NanUtf8String val(result);
		return string(*val, len(val));
	}

	if (Buffer::HasInstance(result)) {
		return string(Buffer::Data(result), Buffer::Length(result));
	}

	return string();
}


static string replace(WrappedRE2* re2, const StringPiece& str,
						const NanCallback& replacer, const Local<Value>& input) {

	const char* data = str.data();
	size_t      size = str.size();

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);
	const StringPiece& match = groups[0];

	size_t lastIndex = 0;
	string result;

	while (lastIndex <= size && re2->regexp.Match(str, lastIndex, size,
				RE2::UNANCHORED, &groups[0], groups.size())) {
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				result += string(data + lastIndex, match.data() - data - lastIndex);
			}
			result += replace(replacer, groups, str, input);
			lastIndex = match.data() - data + match.size();
		} else {
			result += replace(replacer, groups, str, input);
			size_t sym_size = getUtf8CharSize(data[lastIndex]);
			if (lastIndex < size) {
				result.append(data + lastIndex, sym_size);
			}
			lastIndex += sym_size;
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

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(args[0]);
	}

	vector<char> buffer;

	char*  data;
	size_t size;
	bool   isBuffer = false;

	if (args[0]->IsString()) {
		Local<String> t(args[0]->ToString());
		buffer.resize(t->Utf8Length() + 1);
		t->WriteUtf8(&buffer[0]);
		size = buffer.size() - 1;
		data = &buffer[0];
	} else if (Buffer::HasInstance(args[0])) {
		isBuffer = true;
		size = Buffer::Length(args[0]);
		data = Buffer::Data(args[0]);
	} else {
		NanReturnValue(args[0]);
	}

	StringPiece str(data, size);

	if (args[1]->IsString()) {
		string result = replace(re2, str, NanUtf8String(args[1]));
		if (isBuffer) {
			NanReturnValue(NanNewBufferHandle(result.data(), result.size()));
		}
		NanReturnValue(NanNew(result));
	}

	if (args[1]->IsFunction()) {
		string result = replace(re2, str, NanCallback(args[1].As<Function>()), args[0]);
		if (isBuffer) {
			NanReturnValue(NanNewBufferHandle(result.data(), result.size()));
		}
		NanReturnValue(NanNew(result));
	}

	NanReturnValue(args[0]);
}
